export interface ShotPhase {
  title: string;
  cue: string;
  focusAngle: string;
}

export interface ShotMetadata {
  id: string;
  name: string;
  category: "Drives" | "Power & Cross-Bat" | "Defensive & Technical" | "Whips & Sweeps";
  difficulty: "Foundational" | "Intermediate" | "Advanced";
  keyCue: string;
  proExample: string;
  targetElbowAngle: number;
  targetKneeAngle: number;
  videoUrl?: string;
  phases: ShotPhase[];
}

export interface SessionLogItem {
  id: string;
  time: string;
  shot: string;
  confidence: number;
  grade: string;
  status: "success" | "wrong_shot" | "form_error" | "improving";
  message?: string;
}

export type PracticeMode = "no_bat" | "with_bat";

export const CATEGORIES = [
  "All",
  "Drives",
  "Power & Cross-Bat",
  "Defensive & Technical",
  "Whips & Sweeps",
] as const;

export const SHOT_CATALOG: ShotMetadata[] = [
  {
    id: "cover",
    name: "Cover Drive",
    category: "Drives",
    difficulty: "Intermediate",
    keyCue: "Lead with high elbow, head over front knee",
    proExample: "Virat Kohli & Babar Azam Mastery",
    targetElbowAngle: 130,
    targetKneeAngle: 155,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    phases: [
      { title: "Phase 1: Initial Trigger", cue: "Slide backfoot slightly, eyes level on off-stump line", focusAngle: "Spine 10°" },
      { title: "Phase 2: Stride & Knee Flexion", cue: "Lunge forward onto front knee to pitch of delivery", focusAngle: "Knee ≤ 155°" },
      { title: "Phase 3: High Elbow Impact", cue: "Lead downswing with high front elbow directly through cover", focusAngle: "Elbow ≥ 130°" },
      { title: "Phase 4: Vertical Finish", cue: "Hold shape with vertical bat blade high over lead shoulder", focusAngle: "Blade Vertical" },
    ],
  },
  {
    id: "straight",
    name: "Straight Drive",
    category: "Drives",
    difficulty: "Foundational",
    keyCue: "Full bat face presentation down the ground",
    proExample: "Sachin Tendulkar Textbook",
    targetElbowAngle: 135,
    targetKneeAngle: 155,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    phases: [
      { title: "Phase 1: Balanced Base", cue: "Still head over middle stump line, relaxed grip", focusAngle: "Spine 8°" },
      { title: "Phase 2: Straight Stride", cue: "Step directly down the bowler's pitch line", focusAngle: "Knee ≤ 155°" },
      { title: "Phase 3: Full Blade Presentation", cue: "Present full face of the bat straight back past bowler", focusAngle: "Elbow ≥ 135°" },
      { title: "Phase 4: High Follow-Through", cue: "Finish check-drive with hands pointing toward bowler's head", focusAngle: "Blade Vertical" },
    ],
  },
  {
    id: "pull",
    name: "Pull Shot",
    category: "Power & Cross-Bat",
    difficulty: "Intermediate",
    keyCue: "Weight on back foot, full arm extension",
    proExample: "Rohit Sharma Power Arc",
    targetElbowAngle: 120,
    targetKneeAngle: 160,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    phases: [
      { title: "Phase 1: Back & Across Step", cue: "Transfer center of mass onto back foot early", focusAngle: "Weight Back Foot" },
      { title: "Phase 2: Hip Clearance", cue: "Pivot front foot to open hips toward mid-wicket", focusAngle: "Knee 160°" },
      { title: "Phase 3: Arm Extension Reach", cue: "Extend arms fully into wide swing arc in front of body", focusAngle: "Arm Extension ≥80%" },
      { title: "Phase 4: Wrist Roll", cue: "Roll wrists over ball at impact to keep stroke along ground", focusAngle: "Cross-Bat 180°" },
    ],
  },
  {
    id: "hook",
    name: "Hook Shot",
    category: "Power & Cross-Bat",
    difficulty: "Advanced",
    keyCue: "Pivot front hip, control horizontal swing plane",
    proExample: "Ricky Ponting Masterclass",
    targetElbowAngle: 115,
    targetKneeAngle: 165,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
    phases: [
      { title: "Phase 1: Rapid Backfoot Shift", cue: "Move back and inside the line of bouncer", focusAngle: "Head Over Ball Line" },
      { title: "Phase 2: Hip Swivel Rotation", cue: "Swivel hips completely open through leg-side boundary", focusAngle: "Hip Turn 90°" },
      { title: "Phase 3: High Horizontal Swing", cue: "Hit down on ball above shoulder height with arms extended", focusAngle: "Elbow 115°" },
      { title: "Phase 4: Controlled Follow-Through", cue: "Keep head level and balance locked on toes", focusAngle: "Balance Lock" },
    ],
  },
  {
    id: "defense",
    name: "Forward Defense",
    category: "Defensive & Technical",
    difficulty: "Foundational",
    keyCue: "Soft hands, bat and pad held close together",
    proExample: "Rahul Dravid The Wall",
    targetElbowAngle: 110,
    targetKneeAngle: 150,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    phases: [
      { title: "Phase 1: Decisive Front Stride", cue: "Step confidently to pitch of the delivery", focusAngle: "Knee ≤ 150°" },
      { title: "Phase 2: Bat-Pad Flush Seal", cue: "Ensure zero gap between inside edge and front pad", focusAngle: "Gap 0cm" },
      { title: "Phase 3: Soft Grip Impact", cue: "Loosen bottom hand on impact so ball drops directly at feet", focusAngle: "Elbow 110°" },
      { title: "Phase 4: Eyes Over Dead Ball", cue: "Keep head poised over impact point until ball is dead", focusAngle: "Head Over Ball" },
    ],
  },
  {
    id: "square_cut",
    name: "Square Cut",
    category: "Power & Cross-Bat",
    difficulty: "Intermediate",
    keyCue: "Back and across, slice blade through point",
    proExample: "Brian Lara Wizardry",
    targetElbowAngle: 125,
    targetKneeAngle: 160,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    phases: [
      { title: "Phase 1: Deep Back Foot Position", cue: "Move deep into crease and across off stump", focusAngle: "Back Foot Deep" },
      { title: "Phase 2: High Chopping Backlift", cue: "Elevate bat high behind back shoulder", focusAngle: "Blade High Angle" },
      { title: "Phase 3: Downward Arm Chop", cue: "Chop blade downward with wide arm extension through point", focusAngle: "Elbow 125°" },
      { title: "Phase 4: Full Weight Pivot", cue: "Roll wrists sharply to keep slice grounded past gully", focusAngle: "Wrist Roll Down" },
    ],
  },
  {
    id: "late_cut",
    name: "Late Cut",
    category: "Defensive & Technical",
    difficulty: "Advanced",
    keyCue: "Feather touch past slips with supple wrists",
    proExample: "Kane Williamson Precision",
    targetElbowAngle: 115,
    targetKneeAngle: 160,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4",
    phases: [
      { title: "Phase 1: Patient Waiting Stance", cue: "Allow ball to travel deep under your nose", focusAngle: "Impact Behind Eyes" },
      { title: "Phase 2: Soft Wrist Angle", cue: "Open bat face with relaxed wrists angled toward third man", focusAngle: "Open Face 45°" },
      { title: "Phase 3: Deflective Touch", cue: "Use pace of delivery with minimal forward push", focusAngle: "Zero Force Push" },
      { title: "Phase 4: Grounded Steering", cue: "Steer blade downward past second slip cordon", focusAngle: "Grounded Angle" },
    ],
  },
  {
    id: "flick",
    name: "Wrist Flick",
    category: "Whips & Sweeps",
    difficulty: "Intermediate",
    keyCue: "Forearm and wrist roll through mid-wicket corridor",
    proExample: "VVS Laxman / KL Rahul Flow",
    targetElbowAngle: 125,
    targetKneeAngle: 155,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    phases: [
      { title: "Phase 1: Balance on Off-Middle", cue: "Hold steady base without falling across stumps", focusAngle: "Balanced Center" },
      { title: "Phase 2: Straight Downswing", cue: "Bring bat down straight before initiating wrist turn", focusAngle: "Straight Line" },
      { title: "Phase 3: Forearm Roll Turn", cue: "Roll forearms dynamically through mid-wicket corridor", focusAngle: "Wrist Roll 90°" },
      { title: "Phase 4: Fluid Follow-Through", cue: "Hold classical finish with head watching gap", focusAngle: "Full Extension" },
    ],
  },
  {
    id: "lofted",
    name: "Lofted Drive",
    category: "Power & Cross-Bat",
    difficulty: "Advanced",
    keyCue: "Vertical swing plane with clean extension and high finish",
    proExample: "MS Dhoni Clean Elevation",
    targetElbowAngle: 140,
    targetKneeAngle: 150,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    phases: [
      { title: "Phase 1: Power Base Stride", cue: "Plant front foot firmly to create solid launch platform", focusAngle: "Knee ≤ 150°" },
      { title: "Phase 2: Pendulum Acceleration", cue: "Accelerate bat head upward through delivery line", focusAngle: "Upward Arc" },
      { title: "Phase 3: Maximum Arm Reach", cue: "Reach full vertical arm extension through impact zone", focusAngle: "Elbow ≥ 140°" },
      { title: "Phase 4: Skyward Follow-Through", cue: "Finish high over front shoulder with chest open to bowler", focusAngle: "High Finish" },
    ],
  },
  {
    id: "sweep",
    name: "Sweep Shot",
    category: "Whips & Sweeps",
    difficulty: "Intermediate",
    keyCue: "Drop back knee, horizontal blade sweep",
    proExample: "Joe Root Spin Counter",
    targetElbowAngle: 120,
    targetKneeAngle: 140,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    phases: [
      { title: "Phase 1: Drop Back Knee", cue: "Sink back knee onto the turf to lower eye line", focusAngle: "Back Knee Low" },
      { title: "Phase 2: Long Reach Stride", cue: "Extend front leg well forward toward pitch of delivery", focusAngle: "Front Knee 140°" },
      { title: "Phase 3: Horizontal Blade Sweep", cue: "Sweep bat in broad horizontal arc across line of ball", focusAngle: "Elbow 120°" },
      { title: "Phase 4: Head Locked Down", cue: "Keep head still and eyes focused on point of strike", focusAngle: "Cross-Bat Flat" },
    ],
  },
];
