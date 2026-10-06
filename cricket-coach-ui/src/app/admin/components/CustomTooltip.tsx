"use client";

import React from "react";

export function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-zinc-900/95 border border-zinc-700/60 px-4 py-3 backdrop-blur-xl shadow-2xl">
      <p className="text-[11px] font-mono text-zinc-400 mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-zinc-300 capitalize">{entry.name}:</span>
          <span className="font-bold text-white font-mono">
            {typeof entry.value === "number" && entry.name.includes("ccuracy")
              ? `${entry.value}%`
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}
