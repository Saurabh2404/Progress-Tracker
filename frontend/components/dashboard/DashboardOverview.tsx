"use client";

import { BarChart3, CalendarDays, Clock3, Coffee, Folder, Pencil, Play } from "lucide-react";
import { motion } from "framer-motion";
import type { PlanSettings, Sprint } from "@/lib/types";
import { fadeUp, formatDate, minutesLabel, TOTAL_PLAN_DAYS } from "./utils";

type Props = { settings: PlanSettings | null; activeSprint?: Sprint; overallProgress: number; completedDays: number; totalSpentMinutes: number; totalPlanned: number; completedSprints: number; sprintCount: number; saving: boolean; onEdit: () => void; onToggleBreak: () => void };
const items = [{ key: "progress", label: "Overall progress", icon: BarChart3 }, { key: "time", label: "Time spent", icon: Clock3 }, { key: "sprints", label: "Sprints completed", icon: Folder }, { key: "completion", label: "Est. completion", icon: CalendarDays }] as const;

export function DashboardOverview(props: Props) {
  const values = { progress: [`${props.overallProgress}%`, `${props.completedDays} / ${TOTAL_PLAN_DAYS} days`], time: [minutesLabel(props.totalSpentMinutes), `of ${minutesLabel(props.totalPlanned)}`], sprints: [String(props.completedSprints), `of ${props.sprintCount} sprints`], completion: [props.settings ? formatDate(props.settings.completionDate).toUpperCase().replace(/ \d{4}$/, "") : "16 NOV", props.settings ? String(new Date(props.settings.completionDate).getFullYear()) : "2026"] } as const;
  return (
    <>
      <motion.section {...fadeUp} className="mb-5 rounded-lg border border-slate-200 bg-white px-5 py-5 shadow-[0_10px_30px_rgba(25,35,55,0.05)] md:px-6 dark:border-white/10 dark:bg-[#15171d] dark:shadow-black/20">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div><p className="mb-2 text-xs font-semibold text-slate-500">Planly / {props.settings?.planName ?? "Upgrading_Skills"}</p><h1 className="flex items-center gap-2 text-2xl font-bold md:text-[28px]">{props.settings?.planName ?? "Upgrading_Skills"}<button onClick={props.onEdit} className="grid size-8 place-items-center text-slate-400 transition hover:text-[#3182f6]" aria-label="Edit plan"><Pencil size={17} /></button></h1><p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400"><CalendarDays size={16} /> {props.settings ? formatDate(props.settings.startDate) : "26 Sept 2026"}<span className="size-1 rounded-full bg-slate-400" /> Currently on: {props.activeSprint?.name ?? "Sprint 1"}</p></div>
          <div className="flex w-full gap-2 sm:w-auto"><ActionButton onClick={props.onEdit} icon={<Pencil size={15} />} label="Adjust plan" /><ActionButton onClick={props.onToggleBreak} disabled={props.saving} icon={props.settings?.isOnBreak ? <Play size={16} /> : <Coffee size={16} />} label={props.settings?.isOnBreak ? "Resume plan" : "Take a break"} /></div>
        </div>
      </motion.section>
      <motion.section layout className="mb-6 grid overflow-hidden rounded-lg border border-slate-200 bg-slate-100/65 shadow-[0_8px_24px_rgba(24,32,52,0.04)] sm:grid-cols-2 lg:grid-cols-4 dark:border-amber-400/25 dark:bg-[#29261f]">
        {items.map(({ key, label, icon: Icon }, index) => <motion.div key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }} className="min-h-24 border-b border-slate-200 px-5 py-4 transition-colors hover:bg-white/70 sm:border-r lg:border-b-0 dark:border-amber-300/20 dark:hover:bg-white/[0.03]"><div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 dark:text-amber-200/70"><Icon size={16} /> {label}</div><div className="mt-2 flex items-end gap-2"><strong className="text-2xl leading-none">{values[key][0]}</strong><span className="text-xs text-slate-500 dark:text-slate-400">{values[key][1]}</span></div></motion.div>)}
      </motion.section>
    </>
  );
}

function ActionButton({ icon, label, onClick, disabled = false }: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-bold shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-60 sm:flex-none dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] dark:hover:text-blue-300">{icon}{label}</button>;
}
