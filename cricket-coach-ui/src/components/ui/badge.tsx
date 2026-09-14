import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "cyan";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "border-transparent bg-emerald-600/20 text-emerald-400 border border-emerald-500/30",
    secondary: "border-transparent bg-zinc-800 text-zinc-300 border border-zinc-700/50",
    destructive: "border-transparent bg-red-500/20 text-red-400 border border-red-500/30",
    outline: "text-zinc-300 border border-zinc-700",
    success: "border-transparent bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    warning: "border-transparent bg-amber-500/15 text-amber-400 border border-amber-500/30",
    cyan: "border-transparent bg-cyan-500/15 text-cyan-400 border border-cyan-500/30",
  }[variant];

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400",
        variantStyles,
        className
      )}
      {...props}
    />
  );
}

export { Badge };
