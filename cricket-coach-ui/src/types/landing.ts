export interface HeroSlide {
  id: number;
  url: string;
  tag: string;
  title: string;
  subtitle: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=2000&q=85",
    tag: "STADIUM SENSORS",
    title: "Floodlit Cricket Arena",
    subtitle: "Real-time 3D skeletal posture tracking with zero physical body sensors.",
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=2000&q=85",
    tag: "SEAM & ROTATION",
    title: "Ball Spin & Trajectory Telemetry",
    subtitle: "High-precision rotational ball tracking, seam orientation analysis, and dynamic trajectory prediction.",
  },
  {
    id: 3,
    url: "/images/front-elbow-alignment.jpg",
    tag: "DRIVE PRECISION",
    title: "Front Elbow Alignment",
    subtitle: "Instant lead elbow elevation measurement ensuring textbook vertical presentation.",
  },
  {
    id: 4,
    url: "/images/sweet-spot-impact.jpg",
    tag: "SWEET SPOT PRECISION",
    title: "Blade Impact & Willow Dynamics",
    subtitle: "Microsecond acoustic & visual impact telemetry mapping sweet-spot collision efficiency.",
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?auto=format&fit=crop&w=2000&q=85",
    tag: "POWER & CROSS-BAT",
    title: "Kinematic Weight Transfer",
    subtitle: "Measure back-foot load and hip pivot during pull and hook execution.",
  },
  {
    id: 6,
    url: "/images/glossy-seam-flight.jpg",
    tag: "AERODYNAMICS & DRIFT",
    title: "Upright Seam & Angular Velocity",
    subtitle: "Continuous measurement of revolutions per minute (RPM) and seam wobble physics in flight.",
  },
  {
    id: 7,
    url: "https://images.unsplash.com/photo-1593341646782-e0b495cff86d?auto=format&fit=crop&w=2000&q=85",
    tag: "NEURAL CLASSIFIER",
    title: "VideoMAE Spatiotemporal AI",
    subtitle: "Deep 16-frame action recognition model fine-tuned on professional stroke footage.",
  },
];

export interface ShotModule {
  id: string;
  name: string;
  category: string;
  targetElbow: string;
  targetKnee: string;
  difficulty: "Foundational" | "Intermediate" | "Advanced";
  cue: string;
}

export const SHOT_MODULES: ShotModule[] = [
  { id: "cover", name: "Cover Drive", category: "Drives", targetElbow: "≥ 130°", targetKnee: "≤ 155°", difficulty: "Intermediate", cue: "Head over lead knee with high elbow extension." },
  { id: "straight", name: "Straight Drive", category: "Drives", targetElbow: "≥ 135°", targetKnee: "≤ 155°", difficulty: "Foundational", cue: "Full vertical blade presentation straight down the line." },
  { id: "pull", name: "Pull Shot", category: "Power", targetElbow: "≥ 120°", targetKnee: "≤ 160°", difficulty: "Intermediate", cue: "Back foot pivot with full horizontal arm extension." },
  { id: "hook", name: "Hook Shot", category: "Power", targetElbow: "≥ 115°", targetKnee: "≤ 165°", difficulty: "Advanced", cue: "Torso hip rotation with downward wrist roll over impact." },
  { id: "square_cut", name: "Square Cut", category: "Power", targetElbow: "≥ 125°", targetKnee: "≤ 160°", difficulty: "Intermediate", cue: "Step back & across, sharp blade slice behind point." },
  { id: "lofted", name: "Lofted Drive", category: "Power", targetElbow: "≥ 140°", targetKnee: "≤ 150°", difficulty: "Advanced", cue: "Vertical swing plane with clean extension and high finish." },
  { id: "defense", name: "Forward Defense", category: "Technical", targetElbow: "110°", targetKnee: "≤ 150°", difficulty: "Foundational", cue: "Soft impact hands, solid bat face adjacent to front pad." },
  { id: "late_cut", name: "Late Cut", category: "Technical", targetElbow: "115°", targetKnee: "≤ 160°", difficulty: "Advanced", cue: "Feather touch guidance past slips with supple wrists." },
  { id: "flick", name: "Wrist Flick", category: "Whips", targetElbow: "≥ 125°", targetKnee: "≤ 155°", difficulty: "Intermediate", cue: "Snappy forearm roll through the mid-wicket corridor." },
  { id: "sweep", name: "Sweep Shot", category: "Sweeps", targetElbow: "≥ 120°", targetKnee: "≤ 145°", difficulty: "Intermediate", cue: "Deep back-knee crouch with flat horizontal blade sweep." },
];

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  provider: "google" | "email";
  stance: "Right-Hand Batter" | "Left-Hand Batter";
}
