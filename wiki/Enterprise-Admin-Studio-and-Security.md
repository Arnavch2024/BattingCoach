# Enterprise Admin Studio & Security Manual

![Enterprise Security](https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop)

The BatCoach AI Pro platform includes an administrative control studio (`/admin`) designed for coaching staff, academy directors, and systems engineers to inspect live operational metrics, athlete rosters, and system performance.

---

## Authentication & Security Architecture

### 1. Constant-Time Cryptographic Token Verification
To defend against timing attacks where attackers measure microsecond differences in character-by-character comparison strings, token validation utilizes Python's `secrets.compare_digest`:

```python
# coach_backend.py
import secrets

def _verify_admin_token(token: str) -> bool:
    if not ADMIN_API_TOKEN:
        return False
    return secrets.compare_digest(token.strip(), ADMIN_API_TOKEN)
```

### 2. Rolling IP Lockout Rate Limiting
Administrative endpoints are protected by an in-memory sliding-window rate limiter:
* **Failure Budget**: Maximum 5 invalid token attempts per client IP.
* **Lockout Penalty**: Once 5 failed attempts occur within 5 minutes, the IP is placed into an immediate 5-minute lockout window.
* **HTTP 429 Response**: Subsequent verification requests during the lockout period return `HTTP 429 Too Many Requests` with a descriptive retry-after payload.

### 3. Ephemeral Client-Side Credential Storage
To prevent access token leakage:
* Admin tokens are **never hardcoded into the client JavaScript bundle**.
* When coaches authenticate via the login modal on `/admin`, the token is stored strictly in `sessionStorage` within browser memory.
* Closing the browser tab destroys the token session immediately.

### 4. Athlete Scope Enforcement (`X-Athlete-Email`)
All athlete endpoints (`/api/athlete/sync`, `/api/sessions/save`, `/api/sessions/history`, `/api/stats`, `/api/schedule/*`) require a matching `X-Athlete-Email` HTTP header:
* Requests lacking this header or specifying an email mismatch return `HTTP 403 Forbidden`.
* Prevents cross-athlete data enumeration or unauthorized schedule modifications.

---

## Administrative Telemetry Endpoints

The table below lists all administrative endpoints secured by the `Authorization: Bearer <ADMIN_TOKEN>` header:

| Route | Method | Purpose | Response Payload |
|---|---|---|---|
| `/api/admin/verify` | POST | Login credential validation | `{"status": "authorized", "admin": true}` |
| `/api/admin/overview` | GET | Platform KPI aggregates | Total athletes, total sessions, clean accuracy %, hours trained |
| `/api/admin/shot-distribution` | GET | Session breakdown by shot category | Stroke volume distribution and average biomechanical score |
| `/api/admin/flaw-hotspots` | GET | Most prevalent technical flaws | Flaw frequencies (`LOW_ELBOW`, `HEAD_BEHIND_KNEE`, etc.) |
| `/api/admin/athletes` | GET | Complete athlete roster | Athletes list with practice dates, session counts, and stance |
| `/api/admin/sessions/recent` | GET | Real-time session feed | Last 20 practice sessions with detailed stroke breakdowns |
| `/api/admin/timeline` | GET | Daily training activity | Daily rep counts and active practice sessions over time |

---

## Third-Party Observability Integration

The platform provides complete observability through integrations with premier monitoring providers:

### PostHog Product Analytics
* Tracks coaching drill completion rates, drop-offs, and athlete engagement funnels.
* Captures high-priority intervention telemetry whenever the `drill_locked_intervention` event fires.

### Datadog APM & Real User Monitoring (RUM)
* **Frontend RUM**: Captures Core Web Vitals (Largest Contentful Paint, First Input Delay, Cumulative Layout Shift) and browser script errors across global users.
* **Backend Tracing**: Microsecond latency spans monitoring WebSocket frame ingestion, YOLO bat inference, and PostgreSQL query execution.

### Sentry Error Tracking & Crash Diagnostics
* Automated stack trace aggregation across Next.js client rendering, edge route handlers, and FastAPI async workers.
* Release tracking synchronized with GitHub commit hashes.
