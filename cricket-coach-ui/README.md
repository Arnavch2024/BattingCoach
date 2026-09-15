# BatCoach AI Pro - Web Application (`cricket-coach-ui`)

This directory contains the Next.js 16 web frontend for BatCoach AI Pro.

---

## Application Routes & Features

- **`/` (Landing & Athlete Portal)**:
  - Unsplash cricket imagery background slider with smooth crossfade transitions.
  - Athlete authentication portal supporting both 1-Click Google Sign In and Email/Password authentication.
  - Feature highlights, 10-shot practice directory, 3-step technical guide, and footer.
- **`/coach` (Live Coaching Dashboard)**:
  - Real-time video monitor streaming 24 FPS video with AR skeletal overlays from the FastAPI backend.
  - Live biometrics meters for Front Elbow Angle, Lead Knee Flexion, and Head Alignment.
  - Rep and streak tracker driven by the backend kinetic swing motion state machine.
  - Audio voice feedback via the Web Speech Synthesis API.
  - Automated and manual telemetry synchronization with Supabase PostgreSQL.

---

## Running the Frontend

### Prerequisites
- Node.js 18+ and npm

### Setup & Development Server
```bash
# Install dependencies
npm install

# Start local Next.js development server
npm run dev
```

The application will be accessible at [http://localhost:3000](http://localhost:3000).

---

## Environment Configuration

Configuration is located in `.env.local`:
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
NEXT_PUBLIC_API_URL=http://127.0.0.1:8888
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:8888/ws
```

---

## Tech Stack
- **Framework**: Next.js 16 (App Router with Turbopack)
- **Styling**: Tailwind CSS and Lucide Icons
- **Animation**: Framer Motion
- **Audio Feedback**: Web Speech Synthesis API
