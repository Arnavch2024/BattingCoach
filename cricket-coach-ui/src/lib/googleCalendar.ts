/**
 * Google Calendar & Training Schedule Service for BatCoach AI Pro
 * Handles:
 * 1. 1-Click Google Calendar Web Intent integration (Zero-OAuth fallback, universal compatibility)
 * 2. Google Identity Services (GIS) OAuth2 Token Client + Google Calendar REST API
 * 3. RFC 5545 .ICS File generation for mobile and desktop calendar imports
 * 4. Local storage & Supabase synchronization
 */

export type SessionType = 
  | "net_session" 
  | "shadow_drill" 
  | "match_day" 
  | "technique_calibration" 
  | "fitness_agility";

export interface TrainingEvent {
  id: string;
  title: string;
  shotId: string;
  shotName: string;
  sessionType: SessionType;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (24-hour)
  durationMinutes: number;
  targetReps: number;
  location: string;
  notes: string;
  completed: boolean;
  syncedToGoogle?: boolean;
  googleEventId?: string;
  athleteEmail?: string;
  createdAt: string;
}

export const SESSION_TYPE_CONFIG: Record<SessionType, { label: string; icon: string; color: string; bgBadge: string; borderBadge: string }> = {
  net_session: {
    label: "Net Practice",
    icon: "🏏",
    color: "text-emerald-400",
    bgBadge: "bg-emerald-950/60 text-emerald-300",
    borderBadge: "border-emerald-500/30",
  },
  shadow_drill: {
    label: "Shadow Drill",
    icon: "🥋",
    color: "text-cyan-400",
    bgBadge: "bg-cyan-950/60 text-cyan-300",
    borderBadge: "border-cyan-500/30",
  },
  match_day: {
    label: "Match Day",
    icon: "🏆",
    color: "text-amber-400",
    bgBadge: "bg-amber-950/60 text-amber-300",
    borderBadge: "border-amber-500/30",
  },
  technique_calibration: {
    label: "Technique Fix",
    icon: "🎯",
    color: "text-violet-400",
    bgBadge: "bg-violet-950/60 text-violet-300",
    borderBadge: "border-violet-500/30",
  },
  fitness_agility: {
    label: "Cricket Fitness",
    icon: "⚡",
    color: "text-rose-400",
    bgBadge: "bg-rose-950/60 text-rose-300",
    borderBadge: "border-rose-500/30",
  },
};

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || process.env.GOOGLE_API_KEY || "";

/**
 * Format a Date object to Google Calendar URL string format (YYYYMMDDTHHmmSSZ or local YYYYMMDDTHHmm00)
 */
function formatGoogleCalendarDate(dateStr: string, timeStr: string, addMinutes: number = 0): string {
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const [hours, minutes] = timeStr.split(":").map(Number);
    const dateObj = new Date(year, month - 1, day, hours, minutes + addMinutes);
    
    // Output local ISO-like string without separators: YYYYMMDDTHHMMSS
    const pad = (n: number) => String(n).padStart(2, "0");
    const yyyy = dateObj.getFullYear();
    const mm = pad(dateObj.getMonth() + 1);
    const dd = pad(dateObj.getDate());
    const hh = pad(dateObj.getHours());
    const min = pad(dateObj.getMinutes());
    const ss = "00";

    return `${yyyy}${mm}${dd}T${hh}${min}${ss}`;
  } catch (e) {
    return "";
  }
}

/**
 * Build rich, structured cricket drill description for calendar event
 */
export function buildEventDescription(event: TrainingEvent): string {
  const typeLabel = SESSION_TYPE_CONFIG[event.sessionType]?.label || "Batting Session";
  
  return [
    `🏏 BatCoach AI - ${typeLabel}: ${event.title}`,
    ``,
    `🎯 Target Stroke: ${event.shotName}`,
    `📊 Target Reps: ${event.targetReps} Clean Kinematic Reps`,
    `⏱ Duration: ${event.durationMinutes} Minutes`,
    `📍 Venue: ${event.location || "Club Nets / Academy"}`,
    ``,
    `📋 Training Focus & Technique Checklist:`,
    event.notes ? `• ${event.notes}` : `• Focus on balanced stance, textbook bat presentation, and steady head alignment.`,
    `• AI Biomechanical Tracking via VideoMAE & MediaPipe 3D Pose.`,
    ``,
    `👉 Launch Direct Live Practice:`,
    typeof window !== "undefined" 
      ? `${window.location.origin}/coach?shot=${event.shotId}` 
      : `http://localhost:3000/coach?shot=${event.shotId}`,
    ``,
    `Logged with BatCoach AI Pro Olympic Biomechanics Platform.`
  ].join("\n");
}

/**
 * 1-Click Google Calendar Web Intent URL
 * Works in every browser, zero permissions required, pre-fills all event fields.
 */
export function buildGoogleCalendarUrl(event: TrainingEvent): string {
  const startStamp = formatGoogleCalendarDate(event.date, event.startTime, 0);
  const endStamp = formatGoogleCalendarDate(event.date, event.startTime, event.durationMinutes);
  
  const title = `🏏 ${event.title} [BatCoach AI]`;
  const details = buildEventDescription(event);
  const location = event.location || "Cricket Nets / Academy";

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startStamp}/${endStamp}`,
    details: details,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate standard RFC 5545 .ics Calendar file contents for iOS/Android/Desktop calendar import
 */
export function generateIcsCalendar(event: TrainingEvent): string {
  const startStamp = formatGoogleCalendarDate(event.date, event.startTime, 0);
  const endStamp = formatGoogleCalendarDate(event.date, event.startTime, event.durationMinutes);
  const nowStamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const desc = buildEventDescription(event).replace(/\n/g, "\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BatCoach AI//Cricket Training Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.id}@cricketcoach.ai`,
    `DTSTAMP:${nowStamp}`,
    `DTSTART:${startStamp}`,
    `DTEND:${endStamp}`,
    `SUMMARY:🏏 ${event.title}`,
    `DESCRIPTION:${desc}`,
    `LOCATION:${event.location || "Cricket Practice Grounds"}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    `DESCRIPTION:Reminder: ${event.title} starts in 30 minutes!`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Download .ICS file directly to user device
 */
export function downloadIcsFile(event: TrainingEvent): void {
  const icsData = generateIcsCalendar(event);
  const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${event.title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function getGoogleTokenKey(email?: string): string {
  const clean = (email || "").toLowerCase().trim();
  return clean ? `batcoach_gcal_token_${clean}` : "batcoach_gcal_token_default";
}

/**
 * Request Google Calendar OAuth2 Access Token via Google Identity Services (GIS)
 * Scoped specifically to the logged-in user's email session
 */
export function requestGoogleCalendarAuth(
  onSuccess: (token: string) => void, 
  onError?: (err: any) => void,
  userEmail?: string
): void {
  if (typeof window === "undefined" || !(window as any).google?.accounts?.oauth2) {
    if (onError) onError(new Error("Google Identity Services script not yet loaded"));
    return;
  }

  try {
    const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "https://www.googleapis.com/auth/calendar.events",
      hint: userEmail || undefined, // Pre-selects the user's specific Google account if provided
      callback: (tokenResponse: any) => {
        if (tokenResponse?.access_token) {
          sessionStorage.setItem(getGoogleTokenKey(userEmail), tokenResponse.access_token);
          onSuccess(tokenResponse.access_token);
        } else if (tokenResponse?.error) {
          if (onError) onError(tokenResponse);
        }
      },
    });

    tokenClient.requestAccessToken({ prompt: "consent" });
  } catch (err) {
    if (onError) onError(err);
  }
}

/**
 * Insert event directly into Google Calendar via REST API (if user authorized)
 * Isolated per user session token
 */
export async function insertEventToGoogleCalendar(
  event: TrainingEvent, 
  accessToken?: string,
  userEmail?: string
): Promise<{ success: boolean; eventId?: string; htmlLink?: string; error?: string }> {
  const tokenKey = getGoogleTokenKey(userEmail || event.athleteEmail);
  const token = accessToken || (typeof window !== "undefined" ? sessionStorage.getItem(tokenKey) : null);
  
  if (!token) {
    return { success: false, error: "No active Google OAuth token for this athlete. Use 1-click web intent fallback." };
  }

  try {
    const [year, month, day] = event.date.split("-").map(Number);
    const [hours, minutes] = event.startTime.split(":").map(Number);
    const startDate = new Date(year, month - 1, day, hours, minutes);
    const endDate = new Date(year, month - 1, day, hours, minutes + event.durationMinutes);

    const body = {
      summary: `🏏 ${event.title}`,
      description: buildEventDescription(event),
      location: event.location,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 30 },
          { method: "email", minutes: 120 },
        ],
      },
    };

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?key=${GOOGLE_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return { success: false, error: errJson?.error?.message || `HTTP ${res.status}` };
    }

    const json = await res.json();
    return { success: true, eventId: json.id, htmlLink: json.htmlLink };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to create Google Calendar event" };
  }
}

/**
 * Initial starter cricket practice schedule
 */
export function getInitialTrainingSchedule(athleteEmail?: string): TrainingEvent[] {
  const today = new Date();
  const email = athleteEmail || "athlete@cricketcoach.ai";
  
  // Format Date helper
  const getDateStr = (offsetDays: number): string => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  return [
    {
      id: `sched_init_1_${Math.random().toString(36).substring(2, 6)}`,
      title: "Cover Drive High-Elbow Net Session",
      shotId: "cover",
      shotName: "Cover Drive",
      sessionType: "net_session",
      date: getDateStr(1), // Tomorrow
      startTime: "17:00",
      durationMinutes: 45,
      targetReps: 35,
      location: "Main Turf Nets - Academy",
      notes: "Focus on knee bend ≤ 155° and keeping lead elbow high at impact line.",
      completed: false,
      syncedToGoogle: false,
      athleteEmail: email,
      createdAt: new Date().toISOString(),
    },
    {
      id: `sched_init_2_${Math.random().toString(36).substring(2, 6)}`,
      title: "Morning Shadow Biomechanics Calibration",
      shotId: "pull",
      shotName: "Pull Shot",
      sessionType: "shadow_drill",
      date: getDateStr(2), // In 2 days
      startTime: "07:30",
      durationMinutes: 30,
      targetReps: 25,
      location: "Home Practice Studio",
      notes: "Quick hip clearance pivot with arms fully extended into horizontal arc.",
      completed: false,
      syncedToGoogle: false,
      athleteEmail: email,
      createdAt: new Date().toISOString(),
    },
    {
      id: `sched_init_3_${Math.random().toString(36).substring(2, 6)}`,
      title: "Weekend Championship Match & Warmup",
      shotId: "straight",
      shotName: "Straight Drive",
      sessionType: "match_day",
      date: getDateStr(4), // In 4 days
      startTime: "09:30",
      durationMinutes: 60,
      targetReps: 20,
      location: "City Cricket Stadium (Pitch #2)",
      notes: "Pre-match 20 textbook straight drives to dial in front-foot balance.",
      completed: false,
      syncedToGoogle: false,
      athleteEmail: email,
      createdAt: new Date().toISOString(),
    },
    {
      id: `sched_init_4_${Math.random().toString(36).substring(2, 6)}`,
      title: "Forward Defense & Spin Counter Drill",
      shotId: "defense",
      shotName: "Forward Defense",
      sessionType: "technique_calibration",
      date: getDateStr(6),
      startTime: "18:00",
      durationMinutes: 40,
      targetReps: 40,
      location: "Spin Bowling Net #3",
      notes: "Soft hands under eyes, zero bat-pad gap.",
      completed: false,
      syncedToGoogle: false,
      athleteEmail: email,
      createdAt: new Date().toISOString(),
    }
  ];
}

export function getScheduleStorageKey(email?: string): string {
  const clean = (email || "").toLowerCase().trim();
  return clean ? `batcoach_schedule_${clean}` : "batcoach_schedule_guest";
}

/**
 * Load training schedule from local storage, strictly partitioned by user email
 */
export function loadTrainingSchedule(userEmail?: string): TrainingEvent[] {
  if (typeof window === "undefined") return [];
  const key = getScheduleStorageKey(userEmail);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initial = getInitialTrainingSchedule(userEmail);
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load user-specific training schedule:", e);
    return getInitialTrainingSchedule(userEmail);
  }
}

/**
 * Save training schedule to local storage, strictly partitioned by user email
 */
export function saveTrainingSchedule(events: TrainingEvent[], userEmail?: string): void {
  if (typeof window === "undefined") return;
  const key = getScheduleStorageKey(userEmail);
  try {
    localStorage.setItem(key, JSON.stringify(events));
  } catch (e) {
    console.error("Failed to persist user-specific training schedule:", e);
  }
}
