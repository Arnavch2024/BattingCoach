import React from "react";

export function CricketBatIcon({ className = "h-5 w-5", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Bat Grip / Handle */}
      <path
        d="M26.5 5.5L24 3L20 7L22.5 9.5L26.5 5.5Z"
        fill="#10b981"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Handle Grip Ribs */}
      <line x1="21" y1="6" x2="23.5" y2="8.5" stroke="currentColor" strokeWidth="1.2" />
      <line x1="22.5" y1="4.5" x2="25" y2="7" stroke="currentColor" strokeWidth="1.2" />

      {/* Bat Blade (Wood Willow Body) */}
      <path
        d="M20 7L8 19C6.8 20.2 6.2 21.8 6.5 23.5C6.8 25.2 8.2 26.5 10 26.5C11.7 26.5 13.2 25.8 14.5 24.5L22.5 9.5L20 7Z"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Center Spine Ridge of Bat */}
      <path
        d="M19.5 8.5L9.5 22.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />

      {/* Sweet Spot Accent */}
      <circle cx="11.5" cy="21.5" r="1.5" fill="#10b981" />
    </svg>
  );
}

export function CricketBallIcon({ className = "h-4 w-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="9" fill="#ef4444" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7 6C9 9 9 15 7 18" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="1 1.5" />
      <path d="M17 6C15 9 15 15 17 18" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="1 1.5" />
    </svg>
  );
}
