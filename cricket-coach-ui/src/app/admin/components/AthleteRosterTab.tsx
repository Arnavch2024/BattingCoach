"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Users, Search } from "lucide-react";
import { Athlete } from "@/types/admin";

interface AthleteRosterTabProps {
  athletes: Athlete[];
}

export function AthleteRosterTab({ athletes }: AthleteRosterTabProps) {
  const [athleteSearch, setAthleteSearch] = useState("");

  const filteredAthletes = athletes.filter(
    (a) =>
      a.name.toLowerCase().includes(athleteSearch.toLowerCase()) ||
      a.email.toLowerCase().includes(athleteSearch.toLowerCase())
  );

  return (
    <motion.div
      key="athletes"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="rounded-2xl bg-gradient-to-br from-zinc-900/60 to-zinc-950/80 border border-zinc-800/60 p-4 sm:p-6 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Athlete Roster
            </h3>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              All registered athletes with aggregated practice stats
            </p>
          </div>
          <div className="relative w-full sm:w-auto">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={athleteSearch}
              onChange={(e) => setAthleteSearch(e.target.value)}
              placeholder="Search athletes..."
              className="pl-9 pr-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800/60 text-xs text-zinc-200 placeholder:text-zinc-500 font-mono focus:outline-none focus:border-cyan-500/50 w-full sm:w-48 transition-colors"
            />
          </div>
        </div>

        {filteredAthletes.length > 0 ? (
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 custom-scrollbar">
            <table className="w-full text-xs min-w-[620px]">
              <thead>
                <tr className="border-b border-zinc-800/60">
                  <th className="text-left py-3 px-3 font-mono text-zinc-400 uppercase tracking-wider text-[10px]">
                    Athlete
                  </th>
                  <th className="text-left py-3 px-3 font-mono text-zinc-400 uppercase tracking-wider text-[10px]">
                    Stance
                  </th>
                  <th className="text-center py-3 px-3 font-mono text-zinc-400 uppercase tracking-wider text-[10px]">
                    Sessions
                  </th>
                  <th className="text-center py-3 px-3 font-mono text-zinc-400 uppercase tracking-wider text-[10px]">
                    Total Reps
                  </th>
                  <th className="text-center py-3 px-3 font-mono text-zinc-400 uppercase tracking-wider text-[10px]">
                    Accuracy
                  </th>
                  <th className="text-center py-3 px-3 font-mono text-zinc-400 uppercase tracking-wider text-[10px]">
                    Best Streak
                  </th>
                  <th className="text-center py-3 px-3 font-mono text-zinc-400 uppercase tracking-wider text-[10px]">
                    Confidence
                  </th>
                  <th className="text-center py-3 px-3 font-mono text-zinc-400 uppercase tracking-wider text-[10px]">
                    Hours
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAthletes.map((a, i) => (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-zinc-800/30 hover:bg-zinc-800/20 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-zinc-700/50 flex items-center justify-center text-[10px] font-bold text-emerald-400 font-mono">
                          {a.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-medium text-white text-xs">{a.name}</span>
                          <p className="text-[10px] text-zinc-500 font-mono">{a.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-zinc-300 font-mono text-[11px]">{a.stance}</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-400 font-mono text-[11px] font-bold">
                        {a.sessions}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-zinc-300 font-mono">{a.total_reps}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`font-mono font-bold ${
                          a.accuracy >= 80
                            ? "text-emerald-400"
                            : a.accuracy >= 60
                            ? "text-amber-400"
                            : "text-rose-400"
                        }`}
                      >
                        {a.accuracy}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-zinc-300 font-mono">{a.best_streak}</td>
                    <td className="py-3 px-3 text-center text-zinc-300 font-mono">
                      {(a.avg_confidence * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 px-3 text-center text-zinc-300 font-mono">{a.practice_hours}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-zinc-500 text-sm font-mono">
            <div className="text-center space-y-2">
              <Users className="w-8 h-8 mx-auto text-zinc-600" />
              <p>
                {athleteSearch ? "No athletes match your search" : "No athletes registered yet"}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
