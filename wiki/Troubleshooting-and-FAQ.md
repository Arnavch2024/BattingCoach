# Troubleshooting & Frequently Asked Questions

![Troubleshooting & Systems](https://images.unsplash.com/photo-1531415074868-036b1c5d53ec?q=80&w=1200&auto=format&fit=crop)

This guide documents common operational scenarios, diagnostic commands, and resolutions across the BatCoach AI Pro platform.

---

## 1. Webcam Stream Issues

### Symptom: "Camera Permission Denied" or Blank Video Feed
* **Root Cause**: Modern web browsers restrict `navigator.mediaDevices.getUserMedia` access exclusively to secure contexts (`https://` or `http://localhost`).
* **Resolution**:
  1. Verify the URL is served over HTTPS or localhost. In production, ensure the Vercel domain utilizes an active SSL certificate.
  2. In Google Chrome, navigate to `chrome://settings/content/camera` and ensure camera permissions are allowed for the application domain.
  3. Verify that another application (Zoom, OBS Studio, Teams) is not locking the webcam device exclusively.

---

## 2. WebSocket Connection Failures

### Symptom: "WebSocket Connection Failed" or Status Badge Shows Disconnected
* **Root Cause**: WebSocket protocol mismatch, Content Security Policy violation, or sleeping container instance.
* **Resolution**:
  1. **Protocol Check**: Ensure `NEXT_PUBLIC_WS_URL` uses the `wss://` protocol when accessing production HTTPS backends, or `ws://` when testing on `localhost`.
  2. **Container Cold-Start**: If the Azure Container App is scaling from 0 replicas, the initial TCP handshake may take 5 to 15 seconds. The frontend includes automatic reconnection logic that retries every 3 seconds until the container is ready.
  3. **Content Security Policy**: Check the browser Developer Tools console for CSP violations. Verify that `next.config.ts` includes `connect-src 'self' https://*.azurecontainerapps.io wss://*.azurecontainerapps.io`.

---

## 3. Azure Container Apps & Scale-to-Zero Operations

### How to Manually Resume or Warm the Backend
When idle, the Azure backend scales down to 0 replicas to conserve credits. To manually start or warm the instance:
1. Log in to the Azure Portal: `https://portal.azure.com`
2. Navigate to your Resource Group and select the **`bat-coach`** Container App.
3. On the **Overview** blade, check the **Running status**. If stopped, click **Start**.
4. Or trigger an HTTP wake-up call directly via terminal:
   ```bash
   curl -I https://bat-coach.icypond-1d4761cb.eastasia.azurecontainerapps.io/health
   ```
   The endpoint responds with `HTTP 200 OK` once the container initializes.

---

## 4. PostgreSQL Connection Timeouts

### Symptom: `Errno 11001: getaddrinfo failed` or Database Offline in Health Check
* **Root Cause**: Attempting to resolve the direct Supabase database hostname (`db.<project-ref>.supabase.co`) from an IPv4-only container runtime.
* **Resolution**:
  * Always use the Supavisor IPv4 Session Pooler connection string:
    ```
    postgresql://postgres.<project-ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
    ```
  * Verify that any trailing newline (`\n`) characters were stripped from the Azure Container App environment variable configuration.

---

## 5. Python NumPy ABI Compatibility

### Symptom: `_ARRAY_API not found` or C-Extension Crash on Model Load
* **Root Cause**: Installing NumPy 2.0+ alongside older PyTorch, MediaPipe, or OpenCV wheels compiled against the NumPy 1.x C-ABI.
* **Resolution**:
  * Enforce strict NumPy 1.x version pinning:
    ```bash
    pip install "numpy<2.0.0"
    ```
  * In `requirements.txt`, ensure `numpy<2.0.0` is pinned before importing `mediapipe` or `torch`.

---

## 6. Frequently Asked Questions

#### Q: Can I run BatCoach AI Pro without a dedicated GPU?
Yes. The Docker container and backend are optimized for CPU execution. In shadow practice mode, CPU utilization is below 15% on standard consumer laptops.

#### Q: How does the system handle left-handed batsmen?
The biomechanics engine dynamically determines the lead side based on MediaPipe visibility scores and shoulder-hip x-coordinate vectors (`is_left_lead`). Left-handed and right-handed stances are automatically supported.

#### Q: Where are training videos stored?
Slow-motion masterclass videos are stored locally under `cricket-coach-ui/public/tutorials/{shot_id}.mp4` for zero-cost static playback. If a video file is absent, the system seamlessly falls back to the client-side kinematic simulator.
