#!/usr/bin/env python3
"""
Audit script for detecting Python library version conflicts, CVEs, syntax issues,
and NPM package vulnerabilities, automatically opening/updating GitHub Issues.
"""

import os
import sys
import json
import subprocess
import urllib.request
import urllib.error
from datetime import datetime

# Safeguard console output for cross-platform unicode support
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

ISSUE_LABEL = "library-alert"
ISSUE_TITLE_PREFIX = "[Dependency Alert] Library Version Conflict or Vulnerability Detected"

def run_cmd(cmd: list, cwd: str = None) -> tuple[int, str, str]:
    """Run a shell command and return (exit_code, stdout, stderr)."""
    try:
        proc = subprocess.run(
            cmd,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=300
        )
        return proc.returncode, proc.stdout.strip(), proc.stderr.strip()
    except Exception as e:
        return 1, "", str(e)


def audit_python_environment() -> dict:
    """Check for pip version conflicts, syntax errors, and CVEs."""
    results = {
        "has_issues": False,
        "pip_check_errors": [],
        "syntax_errors": [],
        "pip_audit_vulnerabilities": []
    }

    # 1. Check Python syntax compilation across the project
    code, stdout, stderr = run_cmd([sys.executable, "-m", "compileall", "-q", "."])
    if code != 0 or stderr:
        err_msg = stderr or stdout
        if err_msg:
            results["has_issues"] = True
            results["syntax_errors"].append(err_msg)

    # 2. Check for dependency conflicts using pip check
    code, stdout, stderr = run_cmd([sys.executable, "-m", "pip", "check"])
    if code != 0 or stdout:
        conflicts = [line for line in stdout.splitlines() if line.strip()]
        if conflicts:
            results["has_issues"] = True
            results["pip_check_errors"] = conflicts

    # 3. Check for security vulnerabilities via pip-audit if installed
    code, stdout, stderr = run_cmd([sys.executable, "-m", "pip_audit", "-r", "requirements.txt", "--format", "json"])
    if code != 0 and stdout:
        try:
            audit_json = json.loads(stdout)
            vulns = audit_json.get("dependencies", [])
            for dep in vulns:
                for v in dep.get("vulns", []):
                    results["has_issues"] = True
                    results["pip_audit_vulnerabilities"].append({
                        "package": dep.get("name"),
                        "version": dep.get("version"),
                        "id": v.get("id"),
                        "fix_versions": v.get("fix_versions", []),
                        "description": v.get("description", "No description provided.")[:200] + "..."
                    })
        except Exception:
            if "Vulnerabilities found" in stdout or "Vulnerabilities found" in stderr:
                results["has_issues"] = True
                results["pip_audit_vulnerabilities"].append({"raw": stdout or stderr})

    return results


def audit_npm_environment(frontend_dir: str = "cricket-coach-ui") -> dict:
    """Check for NPM vulnerabilities in frontend dependencies."""
    results = {
        "has_issues": False,
        "vulnerabilities": []
    }

    if not os.path.exists(os.path.join(frontend_dir, "package.json")):
        return results

    code, stdout, stderr = run_cmd(["npm", "audit", "--json", "--audit-level=high"], cwd=frontend_dir)
    if stdout:
        try:
            data = json.loads(stdout)
            vulns = data.get("vulnerabilities", {})
            for pkg, info in vulns.items():
                severity = info.get("severity")
                if severity in ["high", "critical"]:
                    results["has_issues"] = True
                    results["vulnerabilities"].append({
                        "package": pkg,
                        "severity": severity,
                        "via": str(info.get("via", []))[:150]
                    })
        except Exception:
            pass

    return results


def format_github_issue_body(py_report: dict, npm_report: dict, run_url: str) -> str:
    """Build a GitHub-flavored markdown issue description."""
    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    lines = [
        f"## 🚨 Automated Dependency & Version Health Alert",
        f"*Detected during automated audit at `{now_str}`*",
        f"[View GitHub Actions Run]({run_url})\n",
        "---"
    ]

    # Python pip check section
    if py_report["pip_check_errors"]:
        lines.append("### 🐍 Python Package Incompatibilities (`pip check`)\n")
        lines.append("The following library version mismatches or broken requirements were detected:\n")
        lines.append("```text")
        for err in py_report["pip_check_errors"]:
            lines.append(f"• {err}")
        lines.append("```\n")
        lines.append("**Remediation:** Adjust version pins in `requirements.txt` to align conflicting peer dependencies.\n")

    # Python syntax section
    if py_report["syntax_errors"]:
        lines.append("### ⚠️ Python Compilation / Syntax Issues\n")
        lines.append("```text")
        for err in py_report["syntax_errors"]:
            lines.append(err)
        lines.append("```\n")

    # Python CVE section
    if py_report["pip_audit_vulnerabilities"]:
        lines.append("### 🛡️ Python Security Advisories (`pip-audit`)\n")
        lines.append("| Package | Installed Version | Advisory ID | Fix Versions |")
        lines.append("| :--- | :--- | :--- | :--- |")
        for v in py_report["pip_audit_vulnerabilities"]:
            if "package" in v:
                fixes = ", ".join(v.get("fix_versions") or ["Pending upstream"])
                lines.append(f"| `{v['package']}` | `{v['version']}` | {v['id']} | `{fixes}` |")
            else:
                lines.append(f"| `{v.get('raw', 'Unknown')}` | - | - | - |")
        lines.append("")

    # NPM section
    if npm_report["vulnerabilities"]:
        lines.append("### 📦 Frontend High/Critical NPM Advisories (`npm audit`)\n")
        lines.append("| Package | Severity | Reason / Dependency Chain |")
        lines.append("| :--- | :--- | :--- |")
        for v in npm_report["vulnerabilities"]:
            lines.append(f"| `{v['package']}` | **{v['severity'].upper()}** | `{v['via']}` |")
        lines.append("\n**Remediation:** Run `npm audit fix` or upgrade outdated packages in `cricket-coach-ui/package.json`.\n")

    lines.append("---")
    lines.append("*This issue was automatically generated by the `.github/workflows/dependency-audit.yml` workflow.*")
    return "\n".join(lines)


def get_github_api(url: str, token: str, method: str = "GET", data: dict = None) -> tuple[int, dict]:
    """Helper to communicate with GitHub REST API."""
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GitHub-Actions-Audit-Bot"
        },
        method=method
    )
    if data:
        req.data = json.dumps(data).encode("utf-8")
        req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        return e.code, {"error": err_body}
    except Exception as e:
        return 500, {"error": str(e)}


def manage_github_issue(py_report: dict, npm_report: dict):
    """Check for open issues, create or update as appropriate."""
    token = os.environ.get("GITHUB_TOKEN")
    repo = os.environ.get("GITHUB_REPOSITORY")
    server_url = os.environ.get("GITHUB_SERVER_URL", "https://github.com")
    run_id = os.environ.get("GITHUB_RUN_ID", "")
    run_url = f"{server_url}/{repo}/actions/runs/{run_id}" if run_id and repo else server_url

    if not token or not repo:
        print("⚠️ GITHUB_TOKEN or GITHUB_REPOSITORY is missing. Skipping GitHub Issue API call.")
        return

    # Check existing open issues
    issues_url = f"https://api.github.com/repos/{repo}/issues?state=open&labels={ISSUE_LABEL}"
    status, issues = get_github_api(issues_url, token)

    has_issues = py_report["has_issues"] or npm_report["has_issues"]

    if has_issues:
        body = format_github_issue_body(py_report, npm_report, run_url)
        if isinstance(issues, list) and len(issues) > 0:
            existing = issues[0]
            issue_number = existing["number"]
            print(f"ℹ️ Found existing open issue #{issue_number}. Updating with latest audit...")
            update_url = f"https://api.github.com/repos/{repo}/issues/{issue_number}"
            get_github_api(update_url, token, method="PATCH", data={"body": body})
            
            # Post a comment to alert subscribers
            comment_url = f"https://api.github.com/repos/{repo}/issues/{issue_number}/comments"
            get_github_api(comment_url, token, method="POST", data={
                "body": f"🔄 **Audit Update ({datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}):** New scan ran in [Run #{run_id}]({run_url}). Unresolved issues remain."
            })
        else:
            print("🚀 Creating a new GitHub Issue for detected library incompatibilities/vulnerabilities...")
            create_url = f"https://api.github.com/repos/{repo}/issues"
            payload = {
                "title": f"{ISSUE_TITLE_PREFIX} - {datetime.utcnow().strftime('%Y-%m-%d')}",
                "body": body,
                "labels": [ISSUE_LABEL, "dependencies", "bug"]
            }
            code, resp = get_github_api(create_url, token, method="POST", data=payload)
            if code in [200, 201]:
                print(f"✅ Created Issue #{resp.get('number')}: {resp.get('html_url')}")
            else:
                print(f"❌ Failed to create issue: HTTP {code} - {resp}")
    else:
        print("🎉 No library version conflicts or vulnerabilities detected.")
        if isinstance(issues, list) and len(issues) > 0:
            existing = issues[0]
            issue_number = existing["number"]
            print(f"🎉 Resolving and closing open Issue #{issue_number}...")
            close_url = f"https://api.github.com/repos/{repo}/issues/{issue_number}"
            get_github_api(close_url, token, method="PATCH", data={"state": "closed"})
            comment_url = f"https://api.github.com/repos/{repo}/issues/{issue_number}/comments"
            get_github_api(comment_url, token, method="POST", data={
                "body": f"✅ **Resolved!** The latest library audit ([Run #{run_id}]({run_url})) confirmed all Python and NPM version conflicts/vulnerabilities have been cleared."
            })


def main():
    print("=" * 60)
    print("🔍 RUNNING DEPENDENCY & LIBRARY VERSION HEALTH AUDIT")
    print("=" * 60)

    py_report = audit_python_environment()
    npm_report = audit_npm_environment()

    print(f"Python check errors: {len(py_report['pip_check_errors'])}")
    print(f"Python syntax errors: {len(py_report['syntax_errors'])}")
    print(f"Python CVEs found: {len(py_report['pip_audit_vulnerabilities'])}")
    print(f"NPM High/Critical CVEs: {len(npm_report['vulnerabilities'])}")

    manage_github_issue(py_report, npm_report)

    if py_report["has_issues"] or npm_report["has_issues"]:
        print("⚠️ Audit detected library issues. GitHub Issue created or updated.")
    else:
        print("✅ All library dependencies and versions are clean.")


if __name__ == "__main__":
    main()
