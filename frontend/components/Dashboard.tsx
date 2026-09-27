"use client";

import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  Coffee,
  Folder,
  LoaderCircle,
  Moon,
  Pencil,
  Star,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { Sprint, Task } from "@/lib/types";

const TOTAL_PLAN_DAYS = 47;

function minutesLabel(minutes = 0) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours}h ${rest}m` : `${rest} min`;
}

function secondsLabel(seconds = 0) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes ? `${minutes} min ${rest} sec` : `${rest} sec`;
}

function dateKey(value: string | Date) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export function Dashboard() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [expandedSprint, setExpandedSprint] = useState<string | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [nextSprints, nextTasks] = await Promise.all([api.getSprints(), api.getTasks()]);
      setSprints(nextSprints);
      setTasks(nextTasks);
      setExpandedSprint((current) => current ?? nextSprints[0]?._id ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load your plan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    const refresh = window.setInterval(() => void loadData(), 30_000);
    return () => window.clearInterval(refresh);
  }, [loadData]);

  const now = useMemo(() => new Date(), []);
  const activeSprint =
    sprints.find((sprint) => new Date(sprint.startDate) <= now && new Date(sprint.endDate) >= now) ?? sprints[0];
  const todayTasks = tasks.filter((task) => dateKey(task.date) === dateKey(now));
  const completedTasks = tasks.filter((task) => task.completed);
  const completedDays = new Set(completedTasks.map((task) => dateKey(task.date))).size;
  const completedSprints = sprints.filter(
    (sprint) => sprint.taskCount > 0 && sprint.taskCount === sprint.completedCount,
  ).length;
  const overallProgress = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const currentTask = todayTasks.find((task) => !task.completed) ?? tasks.find((task) => !task.completed);
  const dayCompleted = todayTasks.filter((task) => task.completed).length;
  const dayMinutes = todayTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const daySpent = todayTasks.reduce((sum, task) => sum + (task.timeSpentSeconds ?? 0), 0);
  const dayProgress = todayTasks.length ? Math.round((dayCompleted / todayTasks.length) * 100) : 0;
  const totalSpent = tasks.reduce((sum, task) => sum + (task.timeSpentSeconds ?? 0), 0);
  const totalPlanned = sprints.reduce((sum, sprint) => sum + (sprint.estimatedMinutes ?? 0), 0);

  useEffect(() => {
    if (!activeSprint || expandedDay) return;
    const firstToday = tasks.find(
      (task) => task.sprintId._id === activeSprint._id && dateKey(task.date) === dateKey(now),
    );
    setExpandedDay(`${activeSprint._id}:${firstToday?.dayNumber ?? 1}`);
  }, [activeSprint, expandedDay, now, tasks]);

  async function toggleTask(task: Task) {
    const previous = tasks;
    setTasks((current) =>
      current.map((item) => (item._id === task._id ? { ...item, completed: !item.completed } : item)),
    );
    try {
      const updated = await api.updateTask(task._id, { completed: !task.completed });
      setTasks((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      setSprints((current) =>
        current.map((sprint) =>
          sprint._id === task.sprintId._id
            ? { ...sprint, completedCount: sprint.completedCount + (task.completed ? -1 : 1) }
            : sprint,
        ),
      );
    } catch (error) {
      setTasks(previous);
      setMessage(error instanceof Error ? error.message : "Could not save progress.");
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f8fa] text-[#6d7480]">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <LoaderCircle className="animate-spin text-[#2f7df6]" size={22} /> Loading your plan
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa] font-[family-name:var(--font-sans)] text-[#20232d]">
      <header className="sticky top-0 z-40 flex h-[58px] items-center border-b border-white/5 bg-[#11111d] px-4 text-white md:px-7">
        <div className="flex items-center gap-2.5 font-semibold">
          <span className="grid size-8 place-items-center rounded-md bg-[#2f7df6] text-sm font-black italic">U</span>
          <span>Upgrading Skills</span>
        </div>
        <div className="ml-auto flex items-center gap-4 text-xs text-[#afb3c3]">
          <span className="hidden sm:inline">Planly workspace</span>
          <span className="h-5 w-px bg-white/15" />
          <Moon size={17} />
        </div>
      </header>

      <main className="mx-auto grid max-w-[1900px] grid-cols-1 gap-5 p-3 md:p-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <section className="mb-5">
            <p className="mb-2 text-xs font-semibold text-[#788091]">
              Planly / <span className="text-[#313747]">Upgrading_Skills</span>
            </p>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="flex items-center gap-2 text-[26px] font-bold tracking-[0] text-[#20232d]">
                  Upgrading_Skills <Pencil size={17} className="text-[#98a2b3]" />
                </h1>
                <p className="mt-2 flex items-center gap-2 text-sm text-[#687083]">
                  <CalendarDays size={16} /> 26 Sept 2026 <span className="size-1 rounded-full bg-[#98a2b3]" />{" "}
                  Currently on: {activeSprint?.name ?? "Sprint 1"}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="h-10 rounded-md border border-[#dfe3ea] bg-white px-4 text-sm font-semibold shadow-sm">
                  Adjust plan
                </button>
                <button className="flex h-10 items-center gap-2 rounded-md border border-[#dfe3ea] bg-white px-4 text-sm font-semibold shadow-sm">
                  <Coffee size={16} /> Take a break
                </button>
              </div>
            </div>
          </section>

          <section className="mb-6 grid overflow-hidden rounded-lg border border-[#e0e4eb] bg-white shadow-[0_2px_10px_rgba(24,32,52,0.05)] sm:grid-cols-2 lg:grid-cols-4">
            <Summary
              icon={<BarChart3 size={16} />}
              label="Overall progress"
              value={`${overallProgress}%`}
              detail={`${completedDays} / ${TOTAL_PLAN_DAYS} days`}
            />
            <Summary
              icon={<Clock3 size={16} />}
              label="Time spent"
              value={secondsLabel(totalSpent)}
              detail={`of ${minutesLabel(totalPlanned)}`}
            />
            <Summary
              icon={<Folder size={16} />}
              label="Sprints completed"
              value={String(completedSprints)}
              detail={`of ${sprints.length} sprints`}
            />
            <Summary icon={<CalendarDays size={16} />} label="Est. completion" value="16 NOV" detail="2026" last />
          </section>

          <section className="space-y-3">
            {sprints.map((sprint) => {
              const isOpen = expandedSprint === sprint._id;
              const sprintTasks = tasks.filter((task) => task.sprintId._id === sprint._id);
              const days = sprint.dayEstimates?.length ?? 0;
              return (
                <article
                  key={sprint._id}
                  className={`overflow-hidden rounded-lg border bg-white ${isOpen ? "border-[#7cb0ff]" : "border-[#e0e4eb]"}`}
                >
                  <button
                    className="flex min-h-14 w-full items-center gap-3 px-4 text-left"
                    onClick={() => setExpandedSprint(isOpen ? null : sprint._id)}
                  >
                    <span
                      className={`size-5 rounded-full border ${sprint.completedCount === sprint.taskCount && sprint.taskCount ? "border-[#20b26b] bg-[#20b26b]" : "border-[#d7dde7]"}`}
                    />
                    <span className="rounded-md border border-[#2f7df6] px-3 py-1 text-xs font-semibold">
                      {sprint.name}
                    </span>
                    <span className="ml-auto hidden rounded-md bg-[#e8f1ff] px-3 py-1 text-xs font-semibold text-[#2f7df6] md:block">
                      {sprint === activeSprint ? "Current" : "• Upcoming"}
                    </span>
                    <span className="text-xs text-[#5f687b]">Est. {minutesLabel(sprint.estimatedMinutes)}</span>
                    <span className="hidden text-xs text-[#5f687b] sm:inline">
                      · Time spent: {secondsLabel(sprint.timeSpentSeconds)}
                    </span>
                    {isOpen ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
                  </button>

                  {isOpen && days > 0 && (
                    <div className="border-t border-[#e5e8ef] px-3 pb-3 md:px-5">
                      <div className="border-l-2 border-[#2f7df6] pl-2">
                        {Array.from({ length: days }, (_, dayIndex) => {
                          const dayNumber = dayIndex + 1;
                          const dayKey = `${sprint._id}:${dayNumber}`;
                          const isDayOpen = expandedDay === dayKey;
                          const dayEstimate = sprint.dayEstimates?.[dayIndex];
                          const isDayOff = dayEstimate == null;
                          const dayTasks = sprintTasks.filter((task) => (task.dayNumber ?? 1) === dayNumber);
                          const complete = dayTasks.length > 0 && dayTasks.every((task) => task.completed);
                          return (
                            <div key={dayKey}>
                              <button
                                className="flex min-h-10 w-full items-center gap-2 text-left"
                                onClick={() => !isDayOff && setExpandedDay(isDayOpen ? null : dayKey)}
                                aria-disabled={isDayOff}
                              >
                                <span
                                  className={`-ml-[19px] grid size-4 place-items-center rounded-full ${isDayOpen ? "bg-[#dbeaff]" : "bg-[#e8edf5]"}`}
                                >
                                  {isDayOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                </span>
                                <span className={`text-sm font-semibold ${complete ? "text-[#20a664]" : ""}`}>
                                  Day {dayNumber}
                                </span>
                                <span className="ml-auto text-xs text-[#59657a]">
                                  {isDayOff ? "Day off" : `Est. ${minutesLabel(dayEstimate)}`}
                                </span>
                                <ChevronRight className="text-[#9aa4b5]" size={17} />
                              </button>
                              {isDayOpen && (
                                <div className="mb-2 overflow-hidden rounded-lg border border-[#e0e5ed] bg-white">
                                  {dayTasks.length ? (
                                    dayTasks.map((task) => <TaskRow task={task} key={task._id} onToggle={toggleTask} />)
                                  ) : (
                                    <div className="px-5 py-7 text-center text-sm text-[#7c8494]">
                                      Question details are waiting for the expanded Day {dayNumber} screenshot.
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        </div>

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-[78px] xl:self-start">
          <div className="flex h-12 items-center justify-between rounded-lg border border-[#e1e5ec] bg-white px-4 shadow-sm">
            <strong className="flex items-center gap-2 text-sm">
              <Star size={16} fill="currentColor" /> Revision list
            </strong>
            <button className="text-sm font-semibold text-[#2f7df6]">View all</button>
          </div>
          <div className="rounded-lg border border-[#e1e5ec] bg-white p-4 shadow-[0_3px_14px_rgba(30,42,64,0.06)]">
            <div className="flex items-center justify-between text-[11px] text-[#778196]">
              <span>Today · {formatDate(now)}</span>
              <span className="text-[#2f7df6]">
                Day {currentTask?.dayNumber ?? 1} · {currentTask?.sprintId.name ?? "Sprint 1"}
              </span>
            </div>
            <p className="mt-5 text-[11px] font-semibold text-[#778196]">◉ START YOUR NEXT TASK</p>
            <div className="mt-2 flex min-h-20 items-center rounded-lg border-l-2 border-[#2f7df6] bg-[#fbfcfe] px-4">
              <strong className="text-[15px]">{currentTask?.title ?? "All caught up"}</strong>
              <button
                className="ml-auto grid size-11 place-items-center rounded-full bg-[#2f7df6] text-white"
                aria-label="Open current task"
              >
                <ArrowRight size={19} />
              </button>
            </div>

            <div className="mt-4 rounded-lg border border-[#e2e6ed] p-3">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold">◉ TODAY&apos;S TASK</h2>
              <div className="max-h-[290px] overflow-y-auto pr-1">
                {(todayTasks.length ? todayTasks : tasks.slice(0, 6)).map((task) => (
                  <button
                    key={task._id}
                    className="flex min-h-10 w-full items-center gap-2 text-left"
                    onClick={() => void toggleTask(task)}
                  >
                    <span
                      className={`grid size-4 shrink-0 place-items-center rounded-full border ${task.completed ? "border-[#20b26b] text-[#20b26b]" : "border-[#aeb7c6] text-[#aeb7c6]"}`}
                    >
                      {task.completed ? <Check size={11} /> : <Circle size={8} />}
                    </span>
                    <span
                      className={`min-w-0 flex-1 truncate text-xs ${task.completed ? "text-[#8991a0] line-through" : ""}`}
                    >
                      {task.title}
                    </span>
                    <Star size={15} className="text-[#8b96a8]" />
                    <span className="text-[10px] text-[#687287]">
                      {task.completed && task.timeSpentSeconds
                        ? secondsLabel(task.timeSpentSeconds)
                        : `Est. ${task.estimatedMinutes} min`}
                    </span>
                    <ChevronRight size={14} className="text-[#9ba5b6]" />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-[#e2e6ed] p-4">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold">
                <BarChart3 size={16} /> DAY PROGRESS
              </h2>
              <ProgressLine label="Tasks" value={`${dayCompleted} / ${todayTasks.length}`} />
              <ProgressLine label="Time spent" value={secondsLabel(daySpent)} />
              <ProgressLine label="Scheduled" value={minutesLabel(dayMinutes)} />
              <div className="mt-3 flex items-center gap-3 text-sm text-[#5f687a]">
                <BarChart3 size={15} /> <span>Progress</span>
                <div className="ml-auto h-2 w-32 overflow-hidden rounded-full bg-[#e7eaf0]">
                  <div className="h-full rounded-full bg-[#2f7df6]" style={{ width: `${dayProgress}%` }} />
                </div>
                <strong className="text-[#20232d]">{dayProgress}%</strong>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {message && (
        <button
          className="fixed right-5 bottom-5 z-50 rounded-md bg-[#20232d] px-4 py-3 text-sm text-white shadow-xl"
          onClick={() => setMessage("")}
        >
          {message}
        </button>
      )}
    </div>
  );
}

function Summary({
  icon,
  label,
  value,
  detail,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  last?: boolean;
}) {
  return (
    <div className={`min-h-24 px-5 py-4 ${last ? "" : "border-b border-[#e4e7ed] sm:border-r sm:border-b-0"}`}>
      <div className="flex items-center gap-2 text-[11px] font-semibold text-[#737d90]">
        {icon} {label}
      </div>
      <div className="mt-2 flex items-end gap-2">
        <strong className="text-2xl leading-none">{value}</strong>
        <span className="text-xs text-[#687287]">{detail}</span>
      </div>
    </div>
  );
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: (task: Task) => Promise<void> }) {
  return (
    <div className="flex min-h-[50px] items-center gap-3 border-b border-[#eef0f4] px-3 last:border-b-0 md:px-4">
      <button
        className={`grid size-4 shrink-0 place-items-center rounded-full border ${task.completed ? "border-[#20b26b] text-[#20b26b]" : "border-[#b6c0cf] text-[#b6c0cf]"}`}
        onClick={() => void onToggle(task)}
        aria-label={task.completed ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}
      >
        {task.completed ? <Check size={11} /> : <Circle size={8} />}
      </button>
      <span
        className={`min-w-0 flex-1 text-xs md:text-sm ${task.completed ? "text-[#8a92a0] line-through" : "text-[#596274]"}`}
      >
        {task.title}
      </span>
      <Star size={16} className="shrink-0 text-[#9aa7ba]" />
      <span className="w-20 text-right text-xs text-[#637087]">Est. {task.estimatedMinutes} min</span>
      <ChevronRight size={15} className="text-[#92a0b3]" />
    </div>
  );
}

function ProgressLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3 flex items-center text-sm text-[#5f687a]">
      <span>{label}</span>
      <strong className="ml-auto text-[#20232d]">{value}</strong>
    </div>
  );
}
