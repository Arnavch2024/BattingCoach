"use client";

import { Activity, AlertTriangle, CheckCircle2, CircleDashed } from "lucide-react";
import { motion } from "framer-motion";
import { MonitoringProvider } from "@/types/admin";

function itemTitle(item: Record<string, unknown>) {
  return String(item.title || item.message || item.event || item.name || "Monitoring event");
}

function itemDetail(item: Record<string, unknown>) {
  const parts = [item.level, item.status, item.timestamp, item.last_seen, item.date];
  return parts.filter((value): value is string | number => typeof value === "string" || typeof value === "number").join(" · ");
}

export function MonitoringTab({ providers, error }: { providers: MonitoringProvider[] | null; error: string | null }) {
  return <motion.section key="monitoring" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-5">
    <div><h2 className="text-lg font-semibold text-white">Observability</h2><p className="text-xs text-zinc-500">Recent errors and events fetched from your monitoring providers.</p></div>
    {!providers && !error && <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 text-sm text-zinc-400">Waiting for monitoring data…</p>}
    {error && <p role="alert" className="rounded-xl border border-amber-700/50 bg-amber-950/30 p-4 text-sm text-amber-200">{error}</p>}
    <div className="grid gap-4 lg:grid-cols-3">
      {(providers || []).map((provider) => {
        const connected = provider.status === "connected";
        const configured = provider.status !== "not_configured";
        const Icon = connected ? CheckCircle2 : configured ? AlertTriangle : CircleDashed;
        return <article key={provider.provider} className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 space-y-4">
          <header className="flex items-center justify-between"><h3 className="font-semibold text-white">{provider.provider}</h3><span className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wide ${connected ? "text-emerald-400" : configured ? "text-amber-400" : "text-zinc-500"}`}><Icon className="h-3.5 w-3.5" />{connected ? "Connected" : configured ? "Unavailable" : "Setup needed"}</span></header>
          {provider.message && <p className="text-xs leading-relaxed text-zinc-400">{provider.message}</p>}
          {connected && provider.items.length === 0 && <p className="text-xs text-zinc-500">No recent items returned.</p>}
          <ul className="space-y-2">{provider.items.slice(0, 10).map((item, index) => <li key={String(item.id || index)} className="rounded-xl border border-zinc-800/70 bg-zinc-900/60 p-3"><p className="flex items-start gap-2 text-xs text-zinc-200"><Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" /><span className="break-words">{itemTitle(item)}</span></p>{itemDetail(item) && <p className="mt-1 pl-5 text-[10px] text-zinc-500">{itemDetail(item)}</p>}</li>)}</ul>
        </article>;
      })}
    </div>
  </motion.section>;
}
