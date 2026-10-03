"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BarChart3, ChevronRight, Search, Star } from "lucide-react";
import type { PlanSettings, Task } from "@/lib/types";
import { formatDate, minutesLabel, revealPanel } from "./utils";
import { TaskRow } from "./TaskRow";

type Props = { settings: PlanSettings | null; now: Date; tasks: Task[]; todayTasks: Task[]; starredTasks: Task[]; currentTask?: Task; revisionExpanded: boolean; dayCompleted: number; daySpentMinutes: number; dayMinutes: number; dayProgress: number; onToggleRevision: () => void; onOpenTask: (task: Task) => void; onToggleTask: (task: Task) => Promise<void>; onStarTask: (task: Task) => Promise<void> };

export function DashboardSidebar(props: Props) {
  const revisions = props.revisionExpanded ? props.starredTasks : props.starredTasks.slice(0, 4);
  const listedTasks = props.todayTasks.length ? props.todayTasks : props.tasks.slice(0, 7);
  return (
    <aside className="min-w-0 space-y-4 xl:sticky xl:top-[84px] xl:max-h-[calc(100vh-100px)] xl:self-start xl:overflow-y-auto xl:pr-1">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_8px_24px_rgba(30,42,64,0.05)] dark:border-white/10 dark:bg-[#15171d]">
        <div className="flex h-12 items-center justify-between border-b border-slate-100 px-4 dark:border-white/10"><strong className="flex items-center gap-2 text-sm"><Star size={16} fill="#f4b740" className="text-[#f4b740]" /> Revision list</strong><button onClick={props.onToggleRevision} className="text-xs font-bold text-blue-500">{props.revisionExpanded ? "Show less" : "View all"}</button></div>
        <AnimatePresence initial={false}>{revisions.length > 0 && <motion.div {...revealPanel} className="overflow-hidden p-2">{revisions.map((task) => <motion.button whileHover={{ x: 2 }} key={task._id} onClick={() => props.onOpenTask(task)} className="flex min-h-10 w-full items-center gap-2 rounded-md px-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.04]"><Star size={14} fill="#f4b740" className="shrink-0 text-[#f4b740]" /><span className="min-w-0 flex-1 truncate text-xs font-semibold">{task.title}</span><ChevronRight size={14} className="text-slate-400" /></motion.button>)}</motion.div>}</AnimatePresence>
        {!props.starredTasks.length && <p className="px-4 py-4 text-xs text-slate-500">Star a task to add it here.</p>}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(30,42,64,0.05)] dark:border-white/10 dark:bg-[#15171d]">
        <div className="flex items-center justify-between text-[11px] text-slate-500"><span>Today · {formatDate(props.now)}</span><span className="text-blue-500">Day {props.currentTask?.dayNumber ?? 1} · {props.currentTask?.sprintId.name ?? "Sprint 1"}</span></div>
        <p className="mt-5 text-[11px] font-bold text-slate-500">NEXT UP</p>
        <motion.div whileHover={{ y: -2 }} className="mt-2 flex min-h-20 items-center rounded-lg border-l-2 border-blue-500 bg-blue-50/70 px-4 dark:bg-blue-500/[0.08]"><div className="min-w-0 flex-1"><strong className="block truncate text-[15px]">{props.settings?.isOnBreak ? "Plan paused" : props.currentTask?.title ?? "All caught up"}</strong>{props.currentTask && !props.settings?.isOnBreak && <span className="mt-2 inline-block rounded bg-blue-500 px-2 py-1 text-[10px] font-bold text-white">START</span>}</div><button disabled={!props.currentTask || props.settings?.isOnBreak} onClick={() => props.currentTask && props.onOpenTask(props.currentTask)} className="ml-3 grid size-11 shrink-0 place-items-center rounded-full bg-blue-500 text-white shadow-[0_7px_22px_rgba(49,130,246,0.35)] transition hover:scale-105 hover:bg-blue-600 disabled:opacity-40" aria-label="Open current task"><ArrowRight size={19} /></button></motion.div>

        <div className="mt-4 rounded-lg border border-slate-200 p-3 dark:border-white/10"><h2 className="mb-2 flex items-center gap-2 text-sm font-bold"><Search size={15} /> TODAY&apos;S TASK</h2><div className="max-h-[280px] overflow-y-auto pr-1">{listedTasks.map((task) => <TaskRow compact key={task._id} task={task} onToggle={props.onToggleTask} onStar={props.onStarTask} onOpen={props.onOpenTask} />)}</div></div>
        <div className="mt-4 rounded-lg border border-slate-200 p-4 dark:border-white/10"><h2 className="mb-4 flex items-center gap-2 text-sm font-bold"><BarChart3 size={16} /> DAY PROGRESS</h2><ProgressLine label="Tasks" value={`${props.dayCompleted} / ${props.todayTasks.length}`} /><ProgressLine label="Time spent" value={minutesLabel(props.daySpentMinutes)} /><ProgressLine label="Scheduled" value={minutesLabel(props.dayMinutes)} /><div className="mt-3 flex items-center gap-3 text-sm text-slate-500"><BarChart3 size={15} /><span>Progress</span><div className="ml-auto h-2 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10"><motion.div initial={{ width: 0 }} animate={{ width: `${props.dayProgress}%` }} className="h-full rounded-full bg-blue-500" /></div><strong className="text-slate-900 dark:text-white">{props.dayProgress}%</strong></div></div>
      </section>
    </aside>
  );
}

function ProgressLine({ label, value }: { label: string; value: string }) { return <div className="mb-3 flex items-center text-sm text-slate-500"><span>{label}</span><strong className="ml-auto text-slate-900 dark:text-white">{value}</strong></div>; }
