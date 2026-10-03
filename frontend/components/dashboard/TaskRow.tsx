"use client";

import { Check, ChevronRight, Circle, Star } from "lucide-react";
import { motion } from "framer-motion";
import type { Task } from "@/lib/types";

type Props = { task: Task; compact?: boolean; onToggle: (task: Task) => Promise<void>; onStar: (task: Task) => Promise<void>; onOpen?: (task: Task) => void };

export function TaskRow({ task, compact = false, onToggle, onStar, onOpen }: Props) {
  return (
    <motion.div id={`task-${task._id}`} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={`group flex items-center gap-3 border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/80 dark:border-white/[0.07] dark:hover:bg-white/[0.04] ${compact ? "min-h-10 px-1" : "min-h-[52px] px-3 md:px-4"}`}>
      <button className={`grid size-4 shrink-0 place-items-center rounded-full border transition hover:scale-110 ${task.completed ? "border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : "border-slate-300 text-slate-400 dark:border-slate-600"}`} onClick={() => void onToggle(task)} aria-label={task.completed ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}>{task.completed ? <Check size={11} /> : <Circle size={8} />}</button>
      {onOpen ? <button onClick={() => onOpen(task)} className={`min-w-0 flex-1 truncate text-left ${compact ? "text-xs" : "text-xs md:text-sm"} ${task.completed ? "text-slate-400 line-through" : "text-slate-600 dark:text-slate-300"}`}>{task.title}</button> : <span className={`min-w-0 flex-1 truncate ${compact ? "text-xs" : "text-xs md:text-sm"} ${task.completed ? "text-slate-400 line-through" : "text-slate-600 dark:text-slate-300"}`}>{task.title}</span>}
      <button onClick={() => void onStar(task)} className={`grid size-8 shrink-0 place-items-center transition hover:scale-110 ${task.starred ? "text-amber-400" : "text-slate-400 hover:text-amber-400"}`} aria-label={task.starred ? `Remove ${task.title} from revision list` : `Add ${task.title} to revision list`}><Star size={compact ? 14 : 16} fill={task.starred ? "currentColor" : "none"} /></button>
      <span className={`${compact ? "text-[10px]" : "w-16 text-[11px] sm:w-20 sm:text-xs"} shrink-0 text-right text-slate-500`}>{compact ? "" : "Est. "}{task.estimatedMinutes} min</span>
      {!compact && <ChevronRight size={15} className="hidden text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-500 sm:block" />}
    </motion.div>
  );
}
