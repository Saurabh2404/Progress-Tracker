"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Check, ChevronDown, Circle } from "lucide-react";
import type { Sprint, Task } from "@/lib/types";
import { minutesLabel, revealPanel, sprintAccents } from "./utils";
import { TaskRow } from "./TaskRow";

type Props = { sprints: Sprint[]; tasks: Task[]; activeSprint?: Sprint; openSprints: Set<string>; openDays: Set<string>; query: string; onToggleSprint: (id: string) => void; onToggleDay: (key: string) => void; onToggleTask: (task: Task) => Promise<void>; onStarTask: (task: Task) => Promise<void> };
export function SprintBoard(props: Props) {
  const normalizedQuery = props.query.trim().toLowerCase();
  return (
    <LayoutGroup><section className="space-y-3">
      {props.sprints.map((sprint, index) => {
        const accent = sprintAccents[index % sprintAccents.length];
        const isOpen = props.openSprints.has(sprint._id);
        const allSprintTasks = props.tasks.filter((task) => task.sprintId._id === sprint._id);
        const sprintTasks = normalizedQuery ? allSprintTasks.filter((task) => task.title.toLowerCase().includes(normalizedQuery)) : allSprintTasks;
        const sprintSpent = allSprintTasks.filter((task) => task.completed).reduce((sum, task) => sum + task.estimatedMinutes, 0);
        if (normalizedQuery && !sprintTasks.length) return null;
        return (
          <motion.article layout key={sprint._id} className={`overflow-hidden rounded-lg border bg-white shadow-[0_5px_18px_rgba(28,38,60,0.04)] transition-shadow dark:bg-[#15171d] ${isOpen ? "border-slate-300 shadow-[0_10px_28px_rgba(28,38,60,0.07)] dark:border-white/15 dark:shadow-black/20" : "border-slate-200 dark:border-white/10"}`}>
            <div className="flex min-h-16 items-center gap-3 border-l-4 px-3 md:px-4" style={{ borderLeftColor: accent }}>
              <span className={`grid size-5 shrink-0 place-items-center rounded-full border ${sprint.completedCount === sprint.taskCount && sprint.taskCount ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 dark:border-slate-600"}`}>{sprint.completedCount === sprint.taskCount && sprint.taskCount ? <Check size={12} /> : null}</span>
              <span className="rounded-md border px-3 py-1 text-xs font-bold" style={{ borderColor: `${accent}80`, color: accent, backgroundColor: `${accent}0a` }}>{sprint.name}</span>
              <span className="ml-auto hidden rounded-md px-3 py-1 text-[11px] font-bold md:block" style={{ backgroundColor: `${accent}18`, color: accent }}>{sprint._id === props.activeSprint?._id ? "Current" : "Upcoming"}</span>
              <span className="text-xs text-slate-500">Est. {minutesLabel(sprint.estimatedMinutes)}</span>
              <span className="hidden text-xs text-slate-500 sm:inline">· Time spent: {minutesLabel(sprintSpent)}</span>
              <motion.button animate={{ rotate: isOpen ? 180 : 0 }} onClick={() => props.onToggleSprint(sprint._id)} className="grid size-9 shrink-0 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:border-blue-300 hover:text-blue-500 dark:border-white/10" aria-label={`${isOpen ? "Close" : "Open"} ${sprint.name}`} aria-expanded={isOpen}><ChevronDown size={17} /></motion.button>
            </div>
            <AnimatePresence initial={false}>{isOpen && <motion.div {...revealPanel} className="overflow-hidden"><div className="border-t border-slate-200 px-3 pb-3 md:px-5 dark:border-white/10"><div className="border-l-2 pl-2" style={{ borderColor: accent }}>
              {Array.from({ length: sprint.dayEstimates?.length ?? 0 }, (_, dayIndex) => {
                const dayNumber = dayIndex + 1; const dayKey = `${sprint._id}:${dayNumber}`; const isDayOpen = props.openDays.has(dayKey); const dayEstimate = sprint.dayEstimates?.[dayIndex]; const isDayOff = dayEstimate == null;
                const dayTasks = sprintTasks.filter((task) => (task.dayNumber ?? 1) === dayNumber); const complete = dayTasks.length > 0 && dayTasks.every((task) => task.completed);
                if (normalizedQuery && !dayTasks.length) return null;
                return <motion.div layout key={dayKey}>
                  <div className="flex min-h-12 items-center gap-2 rounded-md px-1 transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.03]" style={isDayOpen ? { backgroundColor: `${accent}0c` } : undefined}>
                    <span className="-ml-[19px] grid size-4 place-items-center rounded-full text-white" style={{ backgroundColor: complete ? "#22a66b" : isDayOpen ? accent : "#a4adbb" }}>{complete ? <Check size={10} /> : <Circle size={7} />}</span>
                    <span className={`text-sm font-bold ${complete ? "text-emerald-600" : ""}`}>Day {dayNumber}</span><span className="ml-auto text-xs text-slate-500">{isDayOff ? "Day off" : `Est. ${minutesLabel(dayEstimate)}`}</span>
                    <motion.button animate={{ rotate: isDayOpen ? 180 : 0 }} disabled={isDayOff} onClick={() => props.onToggleDay(dayKey)} className="grid size-8 place-items-center rounded-full text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-white/[0.06]" aria-label={`${isDayOpen ? "Close" : "Open"} ${sprint.name} Day ${dayNumber}`} aria-expanded={isDayOpen}><ChevronDown size={16} /></motion.button>
                  </div>
                  <AnimatePresence initial={false}>{isDayOpen && !isDayOff && <motion.div {...revealPanel} className="overflow-hidden"><div className="mb-2 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-[#20232b]">{dayTasks.length ? dayTasks.map((task) => <TaskRow task={task} key={task._id} onToggle={props.onToggleTask} onStar={props.onStarTask} />) : <div className="px-5 py-7 text-center text-sm text-slate-500">No tasks scheduled for this day.</div>}</div></motion.div>}</AnimatePresence>
                </motion.div>;
              })}
            </div></div></motion.div>}</AnimatePresence>
          </motion.article>
        );
      })}
    </section></LayoutGroup>
  );
}
