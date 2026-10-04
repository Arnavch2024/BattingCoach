<#
.SYNOPSIS
    Pushes all Markdown files from the local wiki directory to the GitHub Wiki git repository.

.DESCRIPTION
    Before running this script for the first time:
    1. Visit https://github.com/Arnavch2024/BattingCoach/wiki
    2. Click "Create the first page" and click "Save page" to initialize the GitHub Wiki git repository.
    3. Run this script: .\wiki\push-wiki.ps1
#>

$ErrorActionPreference = "Stop"

$RepoUrl = "https://github.com/Arnavch2024/BattingCoach.wiki.git"
$WikiDir = $PSScriptRoot
$TempDir = Join-Path $env:TEMP ("batcoach-wiki-" + [System.Guid]::NewGuid().ToString("N"))

Write-Host "Cloning GitHub Wiki repository: $RepoUrl ..." -ForegroundColor Cyan

try {
    git clone $RepoUrl $TempDir
} catch {
    Write-Host "Could not clone $RepoUrl." -ForegroundColor Red
    Write-Host "Please ensure you have visited https://github.com/Arnavch2024/BattingCoach/wiki and created your first page to initialize the wiki repository." -ForegroundColor Yellow
    exit 1
}

Write-Host "Copying documentation pages to wiki repository..." -ForegroundColor Cyan
Get-ChildItem -Path $WikiDir -Filter "*.md" | ForEach-Object {
    Copy-Item $_.FullName -Destination $TempDir -Force
    Write-Host "  -> Copied $($_.Name)" -ForegroundColor Green
}

Set-Location $TempDir
try {
    git add -A
    $status = git status --porcelain
    if ($status) {
        git commit -m "docs(wiki): update technical documentation and knowledge base"
        git push origin master
        Write-Host "Successfully pushed all wiki pages to GitHub Wiki!" -ForegroundColor Green
    } else {
        Write-Host "No changes detected in wiki pages." -ForegroundColor Yellow
    }
} finally {
    Set-Location $WikiDir
    if (Test-Path $TempDir) {
        Remove-Item -Recurse -Force $TempDir
    }
}
