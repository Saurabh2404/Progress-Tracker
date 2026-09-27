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
  LogOut,
  Pencil,
  Play,
  Search,
  ShieldCheck,
  Star,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { PlanSettings, SessionUser, Sprint, Task } from "@/lib/types";

const TOTAL_PLAN_DAYS = 47;

function minutesLabel(minutes = 0) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours && !rest) return `${hours}h`;
  return hours ? `${hours}h ${rest}m` : `${rest} min`;
}

function dateKey(value: string | Date) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value),
  );
}

function inputDate(value: string | Date) {
  return dateKey(value);
}

function initials(email: string) {
  return email.slice(0, 2).toUpperCase() || "US";
}

export function Dashboard() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [settings, setSettings] = useState<PlanSettings | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [openSprints, setOpenSprints] = useState<Set<string>>(new Set());
  const [openDays, setOpenDays] = useState<Set<string>>(new Set());
  const [revisionExpanded, setRevisionExpanded] = useState(false);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planName, setPlanName] = useState("");
  const [completionDate, setCompletionDate] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [nextSprints, nextTasks, nextSettings, nextUser] = await Promise.all([
        api.getSprints(),
        api.getTasks(),
        api.getSettings(),
        api.getSession(),
      ]);
      setSprints(nextSprints);
      setTasks(nextTasks);
      setSettings(nextSettings);
      setUser(nextUser);

      const today = new Date();
      const current =
        nextSprints.find(
          (sprint) => new Date(sprint.startDate) <= today && new Date(sprint.endDate) >= today,
        ) ?? nextSprints[0];
      if (current) {
        setOpenSprints((existing) => (existing.size ? existing : new Set([current._id])));
        const currentTask = nextTasks.find(
          (task) => task.sprintId._id === current._id && dateKey(task.date) === dateKey(today),
        );
        setOpenDays((existing) =>
          existing.size ? existing : new Set([`${current._id}:${currentTask?.dayNumber ?? 1}`]),
        );
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load your plan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const now = useMemo(() => new Date(), []);
  const activeSprint =
    sprints.find((sprint) => new Date(sprint.startDate) <= now && new Date(sprint.endDate) >= now) ?? sprints[0];
  const todayTasks = tasks.filter((task) => dateKey(task.date) === dateKey(now));
  const completedTasks = tasks.filter((task) => task.completed);
  const starredTasks = tasks.filter((task) => task.starred);
  const completedDays = new Set(completedTasks.map((task) => dateKey(task.date))).size;
  const completedSprints = sprints.filter(
    (sprint) => sprint.taskCount > 0 && sprint.taskCount === sprint.completedCount,
  ).length;
  const overallProgress = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const currentTask = todayTasks.find((task) => !task.completed) ?? tasks.find((task) => !task.completed);
  const dayCompleted = todayTasks.filter((task) => task.completed).length;
  const dayMinutes = todayTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const daySpentMinutes = todayTasks
    .filter((task) => task.completed)
    .reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const dayProgress = todayTasks.length ? Math.round((dayCompleted / todayTasks.length) * 100) : 0;
  const totalSpentMinutes = completedTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const totalPlanned = sprints.reduce((sum, sprint) => sum + (sprint.estimatedMinutes ?? 0), 0);
  const visibleRevisionTasks = revisionExpanded ? starredTasks : starredTasks.slice(0, 4);

  function toggleSet(setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) {
    setter((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function toggleTask(task: Task) {
    const previous = tasks;
    const completed = !task.completed;
    setTasks((current) => current.map((item) => (item._id === task._id ? { ...item, completed } : item)));
    try {
      const updated = await api.updateTask(task._id, { completed });
      setTasks((current) => current.map((item) => (item._id === updated._id ? updated : item)));
      setSprints((current) =>
        current.map((sprint) =>
          sprint._id === task.sprintId._id
            ? { ...sprint, completedCount: sprint.completedCount + (completed ? 1 : -1) }
            : sprint,
        ),
      );
    } catch (error) {
      setTasks(previous);
      setMessage(error instanceof Error ? error.message : "Could not save progress.");
    }
  }

  async function toggleStar(task: Task) {
    const previous = tasks;
    const starred = !task.starred;
    setTasks((current) => current.map((item) => (item._id === task._id ? { ...item, starred } : item)));
    try {
      const updated = await api.updateTask(task._id, { starred });
      setTasks((current) => current.map((item) => (item._id === updated._id ? updated : item)));
    } catch (error) {
      setTasks(previous);
      setMessage(error instanceof Error ? error.message : "Could not update the revision list.");
    }
  }

  function openTask(task: Task) {
    setOpenSprints((current) => new Set(current).add(task.sprintId._id));
    setOpenDays((current) => new Set(current).add(`${task.sprintId._id}:${task.dayNumber ?? 1}`));
    window.setTimeout(() => {
      document.getElementById(`task-${task._id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 350);
  }

  function openPlanDialog() {
    if (!settings) return;
    setPlanName(settings.planName);
    setCompletionDate(inputDate(settings.completionDate));
    setPlanDialogOpen(true);
  }

  async function savePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingSettings(true);
    try {
      const updated = await api.updateSettings({
        planName,
        completionDate: new Date(`${completionDate}T12:00:00`).toISOString(),
      });
      setSettings(updated);
      setPlanDialogOpen(false);
      setMessage("Plan details updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update the plan.");
    } finally {
      setSavingSettings(false);
    }
  }

  async function toggleBreak() {
    if (!settings || savingSettings) return;
    setSavingSettings(true);
    try {
      const updated = await api.updateSettings({ isOnBreak: !settings.isOnBreak });
      setSettings(updated);
      setMessage(updated.isOnBreak ? "Break started. Your progress is saved." : "Welcome back. Your plan is active.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update break status.");
    } finally {
      setSavingSettings(false);
    }
  }

  async function logout() {
    await api.logout();
    window.location.assign("/login");
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f6f9] text-[#60697a]">
        <div className="flex items-center gap-3 text-sm font-bold">
          <LoaderCircle className="animate-spin text-[#2f7df6]" size={22} /> Loading your plan
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] font-[family-name:var(--font-sans)] text-[#20232d]">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#171722]/95 text-white shadow-[0_10px_30px_rgba(17,17,29,0.12)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1900px] items-center gap-5 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-[#2f7df6] text-sm font-black italic shadow-[0_6px_18px_rgba(47,125,246,0.35)]">U</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">Upgrading Skills</p>
              <p className="hidden truncate text-[10px] text-[#aeb4c4] sm:block">Personal learning workspace</p>
            </div>
          </div>

          <div className="mx-auto hidden h-9 items-center gap-3 rounded-md border border-white/10 bg-white/[0.06] px-4 lg:flex">
            <ShieldCheck size={15} className="text-[#75a9ff]" />
            <span className="max-w-56 truncate text-xs font-semibold text-[#d9deea]">{settings?.planName ?? "Upgrading_Skills"}</span>
            <span className="h-4 w-px bg-white/15" />
            <span className="text-xs text-[#aeb4c4]">{activeSprint?.name ?? "Sprint 1"}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden text-right md:block">
              <p className="max-w-52 truncate text-xs font-semibold">{user?.email}</p>
              <p className="text-[10px] text-[#9299aa]">Private account</p>
            </div>
            <span className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/10 text-xs font-bold">
              {initials(user?.email ?? "")}
            </span>
            <button
              onClick={() => void logout()}
              className="grid size-9 place-items-center rounded-md text-[#b9bfcc] transition hover:bg-white/10 hover:text-white"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1900px] grid-cols-1 gap-5 p-3 md:p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <section className="mb-5 rounded-lg border border-[#e1e5ec] bg-white px-5 py-5 shadow-[0_8px_24px_rgba(31,42,68,0.05)] md:px-6">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="mb-2 text-xs font-bold text-[#788091]">Planly / {settings?.planName ?? "Upgrading_Skills"}</p>
                <h1 className="flex items-center gap-2 text-2xl font-bold tracking-[0] md:text-[28px]">
                  {settings?.planName ?? "Upgrading_Skills"}
                  <button onClick={openPlanDialog} className="grid size-8 place-items-center text-[#98a2b3] transition hover:text-[#2f7df6]" aria-label="Edit plan">
                    <Pencil size={17} />
                  </button>
                </h1>
                <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#687083]">
                  <CalendarDays size={16} /> {settings ? formatDate(settings.startDate) : "26 Sept 2026"}
                  <span className="size-1 rounded-full bg-[#98a2b3]" /> Currently on: {activeSprint?.name ?? "Sprint 1"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={openPlanDialog} className="flex h-10 items-center gap-2 rounded-md border border-[#dfe3ea] bg-white px-4 text-sm font-bold shadow-sm transition hover:border-[#9fc1f8] hover:bg-[#f5f9ff] hover:text-[#246bd6]">
                  <Pencil size={15} /> Adjust plan
                </button>
                <button onClick={() => void toggleBreak()} disabled={savingSettings} className={`flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-bold shadow-sm transition disabled:opacity-60 ${settings?.isOnBreak ? "border-[#9fc1f8] bg-[#edf5ff] text-[#246bd6]" : "border-[#dfe3ea] bg-white hover:border-[#9fc1f8] hover:bg-[#f5f9ff]"}`}>
                  {settings?.isOnBreak ? <Play size={16} /> : <Coffee size={16} />}
                  {settings?.isOnBreak ? "Resume plan" : "Take a break"}
                </button>
              </div>
            </div>
          </section>

          <div aria-hidden={!settings?.isOnBreak} inert={!settings?.isOnBreak} className={`mb-5 grid overflow-hidden transition-[grid-template-rows,opacity] duration-500 ease-out ${settings?.isOnBreak ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
            <div className="min-h-0">
              <div className="flex items-center gap-3 rounded-lg border border-[#c6dbff] bg-[#edf5ff] px-4 py-3 text-sm text-[#245da9]">
                <Coffee size={18} />
                <strong>Plan paused</strong>
                <span className="text-[#5577a7]">Your saved progress and revision list are unchanged.</span>
                <button onClick={() => void toggleBreak()} className="ml-auto font-bold text-[#246bd6]">Resume</button>
              </div>
            </div>
          </div>

          <section className="mb-6 grid overflow-hidden rounded-lg border border-[#e0e4eb] bg-white shadow-[0_8px_24px_rgba(24,32,52,0.05)] sm:grid-cols-2 lg:grid-cols-4">
            <Summary icon={<BarChart3 size={16} />} label="Overall progress" value={`${overallProgress}%`} detail={`${completedDays} / ${TOTAL_PLAN_DAYS} days`} />
            <Summary icon={<Clock3 size={16} />} label="Time spent" value={minutesLabel(totalSpentMinutes)} detail={`of ${minutesLabel(totalPlanned)}`} />
            <Summary icon={<Folder size={16} />} label="Sprints completed" value={String(completedSprints)} detail={`of ${sprints.length} sprints`} />
            <Summary icon={<CalendarDays size={16} />} label="Est. completion" value={settings ? formatDate(settings.completionDate).toUpperCase().replace(/ 2026$/, "") : "16 NOV"} detail={settings ? String(new Date(settings.completionDate).getFullYear()) : "2026"} last />
          </section>

          <section className="space-y-3">
            {sprints.map((sprint) => {
              const isOpen = openSprints.has(sprint._id);
              const sprintTasks = tasks.filter((task) => task.sprintId._id === sprint._id);
              const sprintSpent = sprintTasks.filter((task) => task.completed).reduce((sum, task) => sum + task.estimatedMinutes, 0);
              const days = sprint.dayEstimates?.length ?? 0;
              return (
                <article key={sprint._id} className={`overflow-hidden rounded-lg border bg-white shadow-[0_4px_16px_rgba(32,44,72,0.035)] transition-all duration-300 ${isOpen ? "border-[#7cb0ff] shadow-[0_10px_30px_rgba(47,125,246,0.08)]" : "border-[#e0e4eb] hover:border-[#c9d2df] hover:shadow-[0_8px_22px_rgba(32,44,72,0.06)]"}`}>
                  <div className="flex min-h-16 items-center gap-3 border-l-4 px-4" style={{ borderLeftColor: sprint.color }}>
                    <span className={`grid size-5 shrink-0 place-items-center rounded-full border transition ${sprint.completedCount === sprint.taskCount && sprint.taskCount ? "border-[#20b26b] bg-[#20b26b] text-white" : "border-[#d7dde7]"}`}>
                      {sprint.completedCount === sprint.taskCount && sprint.taskCount ? <Check size={12} /> : null}
                    </span>
                    <span className="rounded-md border border-[#7daeff] bg-[#f8fbff] px-3 py-1 text-xs font-bold">{sprint.name}</span>
                    <span className="ml-auto hidden rounded-md bg-[#e8f1ff] px-3 py-1 text-[11px] font-bold text-[#2f7df6] md:block">{sprint === activeSprint ? "Current" : "Upcoming"}</span>
                    <span className="text-xs text-[#5f687b]">Est. {minutesLabel(sprint.estimatedMinutes)}</span>
                    <span className="hidden text-xs text-[#5f687b] sm:inline">· Time spent: {minutesLabel(sprintSpent)}</span>
                    <button onClick={() => toggleSet(setOpenSprints, sprint._id)} className={`grid size-9 shrink-0 place-items-center rounded-full border transition-all duration-300 ${isOpen ? "rotate-180 border-[#b7d2fb] bg-[#edf5ff] text-[#2f7df6]" : "border-[#e0e5ed] text-[#7b8798] hover:border-[#9fc1f8] hover:text-[#2f7df6]"}`} aria-label={`${isOpen ? "Close" : "Open"} ${sprint.name}`} aria-expanded={isOpen}>
                      <ChevronDown size={17} />
                    </button>
                  </div>

                  <div aria-hidden={!isOpen} inert={!isOpen} className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="min-h-0 overflow-hidden">
                      <div className="border-t border-[#e5e8ef] px-3 pb-3 md:px-5">
                        <div className="border-l-2 border-[#2f7df6] pl-2">
                          {Array.from({ length: days }, (_, dayIndex) => {
                            const dayNumber = dayIndex + 1;
                            const dayKey = `${sprint._id}:${dayNumber}`;
                            const isDayOpen = openDays.has(dayKey);
                            const dayEstimate = sprint.dayEstimates?.[dayIndex];
                            const isDayOff = dayEstimate == null;
                            const dayTasks = sprintTasks.filter((task) => (task.dayNumber ?? 1) === dayNumber);
                            const complete = dayTasks.length > 0 && dayTasks.every((task) => task.completed);
                            return (
                              <div key={dayKey}>
                                <div className="flex min-h-12 items-center gap-2">
                                  <span className={`-ml-[19px] grid size-4 place-items-center rounded-full transition ${isDayOpen ? "bg-[#dbeaff] text-[#2f7df6]" : "bg-[#e8edf5] text-[#7b8798]"}`}>
                                    {complete ? <Check size={10} /> : <Circle size={7} />}
                                  </span>
                                  <span className={`text-sm font-bold ${complete ? "text-[#20a664]" : ""}`}>Day {dayNumber}</span>
                                  <span className="ml-auto text-xs text-[#59657a]">{isDayOff ? "Day off" : `Est. ${minutesLabel(dayEstimate)}`}</span>
                                  <button disabled={isDayOff} onClick={() => toggleSet(setOpenDays, dayKey)} className={`grid size-8 place-items-center rounded-full transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-30 ${isDayOpen ? "rotate-180 bg-[#edf5ff] text-[#2f7df6]" : "text-[#8b96a8] hover:bg-[#f0f4f9] hover:text-[#2f7df6]"}`} aria-label={`${isDayOpen ? "Close" : "Open"} ${sprint.name} Day ${dayNumber}`} aria-expanded={isDayOpen}>
                                    <ChevronDown size={16} />
                                  </button>
                                </div>
                                <div aria-hidden={!isDayOpen} inert={!isDayOpen} className={`grid transition-[grid-template-rows,opacity,transform] duration-500 ease-out ${isDayOpen ? "grid-rows-[1fr] translate-y-0 opacity-100" : "grid-rows-[0fr] -translate-y-1 opacity-0"}`}>
                                  <div className="min-h-0 overflow-hidden">
                                    <div className="mb-2 overflow-hidden rounded-lg border border-[#e0e5ed] bg-white">
                                      {dayTasks.length ? dayTasks.map((task) => <TaskRow task={task} key={task._id} onToggle={toggleTask} onStar={toggleStar} />) : <div className="px-5 py-7 text-center text-sm text-[#7c8494]">No tasks scheduled for this day.</div>}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        </div>

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-[84px] xl:max-h-[calc(100vh-100px)] xl:self-start xl:overflow-y-auto xl:pr-1">
          <div className="overflow-hidden rounded-lg border border-[#e1e5ec] bg-white shadow-[0_8px_24px_rgba(30,42,64,0.06)]">
            <div className="flex h-12 items-center justify-between border-b border-[#edf0f4] px-4">
              <strong className="flex items-center gap-2 text-sm"><Star size={16} fill="#f4b740" className="text-[#f4b740]" /> Revision list</strong>
              <button onClick={() => setRevisionExpanded((current) => !current)} className="text-xs font-bold text-[#2f7df6]">{revisionExpanded ? "Show less" : "View all"}</button>
            </div>
            <div className={`grid transition-[grid-template-rows] duration-300 ${visibleRevisionTasks.length ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
              <div className="min-h-0 overflow-hidden">
                <div className="p-2">
                  {visibleRevisionTasks.map((task) => (
                    <button key={task._id} onClick={() => openTask(task)} className="flex min-h-10 w-full items-center gap-2 rounded-md px-2 text-left transition hover:bg-[#f4f7fb]">
                      <Star size={14} fill="#f4b740" className="shrink-0 text-[#f4b740]" />
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold">{task.title}</span>
                      <ChevronRight size={14} className="text-[#9aa4b5]" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {!starredTasks.length && <p className="px-4 py-4 text-xs text-[#7b8494]">Star a task to add it here.</p>}
          </div>

          <div className="rounded-lg border border-[#e1e5ec] bg-white p-4 shadow-[0_8px_24px_rgba(30,42,64,0.06)]">
            <div className="flex items-center justify-between text-[11px] text-[#778196]">
              <span>Today · {formatDate(now)}</span>
              <span className="text-[#2f7df6]">Day {currentTask?.dayNumber ?? 1} · {currentTask?.sprintId.name ?? "Sprint 1"}</span>
            </div>
            <p className="mt-5 text-[11px] font-bold text-[#778196]">START YOUR NEXT TASK</p>
            <div className="mt-2 flex min-h-20 items-center rounded-lg border-l-2 border-[#2f7df6] bg-[#f8fbff] px-4">
              <strong className="min-w-0 flex-1 text-[15px]">{settings?.isOnBreak ? "Plan paused" : currentTask?.title ?? "All caught up"}</strong>
              <button disabled={!currentTask || settings?.isOnBreak} onClick={() => currentTask && openTask(currentTask)} className="ml-3 grid size-11 shrink-0 place-items-center rounded-full bg-[#2f7df6] text-white shadow-[0_6px_18px_rgba(47,125,246,0.3)] transition hover:scale-105 hover:bg-[#246bd6] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Open current task">
                <ArrowRight size={19} />
              </button>
            </div>

            <div className="mt-4 rounded-lg border border-[#e2e6ed] p-3">
              <h2 className="mb-2 flex items-center gap-2 text-sm font-bold"><Search size={15} /> TODAY&apos;S TASK</h2>
              <div className="max-h-[285px] overflow-y-auto pr-1">
                {(todayTasks.length ? todayTasks : tasks.slice(0, 6)).map((task) => (
                  <div key={task._id} className="flex min-h-10 items-center gap-2 rounded-md px-1 transition hover:bg-[#f7f9fc]">
                    <button onClick={() => void toggleTask(task)} className={`grid size-4 shrink-0 place-items-center rounded-full border ${task.completed ? "border-[#20b26b] text-[#20b26b]" : "border-[#aeb7c6] text-[#aeb7c6]"}`} aria-label={task.completed ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}>
                      {task.completed ? <Check size={11} /> : <Circle size={8} />}
                    </button>
                    <button onClick={() => openTask(task)} className={`min-w-0 flex-1 truncate text-left text-xs ${task.completed ? "text-[#8991a0] line-through" : ""}`}>{task.title}</button>
                    <button onClick={() => void toggleStar(task)} className={`grid size-7 place-items-center transition hover:scale-110 ${task.starred ? "text-[#f4b740]" : "text-[#98a2b3] hover:text-[#f4b740]"}`} aria-label={task.starred ? `Remove ${task.title} from revision list` : `Add ${task.title} to revision list`}>
                      <Star size={15} fill={task.starred ? "currentColor" : "none"} />
                    </button>
                    <span className="text-[10px] text-[#687287]">{task.completed ? minutesLabel(task.estimatedMinutes) : `Est. ${task.estimatedMinutes} min`}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-[#e2e6ed] p-4">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-bold"><BarChart3 size={16} /> DAY PROGRESS</h2>
              <ProgressLine label="Tasks" value={`${dayCompleted} / ${todayTasks.length}`} />
              <ProgressLine label="Time spent" value={minutesLabel(daySpentMinutes)} />
              <ProgressLine label="Scheduled" value={minutesLabel(dayMinutes)} />
              <div className="mt-3 flex items-center gap-3 text-sm text-[#5f687a]">
                <BarChart3 size={15} /> <span>Progress</span>
                <div className="ml-auto h-2 w-28 overflow-hidden rounded-full bg-[#e7eaf0]">
                  <div className="h-full rounded-full bg-[#2f7df6] transition-[width] duration-700 ease-out" style={{ width: `${dayProgress}%` }} />
                </div>
                <strong className="text-[#20232d]">{dayProgress}%</strong>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <div aria-hidden={!planDialogOpen} inert={!planDialogOpen} className={`fixed inset-0 z-[70] grid place-items-center bg-[#11111d]/45 p-4 backdrop-blur-sm transition duration-300 ${planDialogOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`} onMouseDown={(event) => event.target === event.currentTarget && setPlanDialogOpen(false)}>
        <form onSubmit={savePlan} className={`w-full max-w-md rounded-lg border border-white/50 bg-white p-6 shadow-2xl transition duration-300 ${planDialogOpen ? "translate-y-0 scale-100" : "translate-y-4 scale-95"}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#2f7df6]">PLAN SETTINGS</p>
              <h2 className="mt-1 text-xl font-bold">Adjust your plan</h2>
            </div>
            <button type="button" onClick={() => setPlanDialogOpen(false)} className="grid size-9 place-items-center rounded-full text-[#7b8494] transition hover:bg-[#f0f3f7] hover:text-[#20232d]" aria-label="Close plan settings"><X size={19} /></button>
          </div>
          <label className="mt-6 block">
            <span className="mb-2 block text-xs font-bold text-[#667085]">Plan name</span>
            <input required value={planName} onChange={(event) => setPlanName(event.target.value)} className="h-11 w-full rounded-md border border-[#d9dee8] px-3 text-sm outline-none transition focus:border-[#2f7df6] focus:ring-4 focus:ring-[#2f7df6]/10" />
          </label>
          <label className="mt-4 block">
            <span className="mb-2 block text-xs font-bold text-[#667085]">Target completion date</span>
            <input required type="date" value={completionDate} onChange={(event) => setCompletionDate(event.target.value)} className="h-11 w-full rounded-md border border-[#d9dee8] px-3 text-sm outline-none transition focus:border-[#2f7df6] focus:ring-4 focus:ring-[#2f7df6]/10" />
          </label>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setPlanDialogOpen(false)} className="h-10 rounded-md border border-[#dfe3ea] px-4 text-sm font-bold transition hover:bg-[#f5f7fa]">Cancel</button>
            <button disabled={savingSettings} className="flex h-10 items-center gap-2 rounded-md bg-[#2f7df6] px-4 text-sm font-bold text-white transition hover:bg-[#246bd6] disabled:opacity-60">{savingSettings && <LoaderCircle size={15} className="animate-spin" />} Save changes</button>
          </div>
        </form>
      </div>

      {message && <button className="fixed right-5 bottom-5 z-[80] rounded-md bg-[#20232d] px-4 py-3 text-sm font-semibold text-white shadow-xl" onClick={() => setMessage("")}>{message}</button>}
    </div>
  );
}

function Summary({ icon, label, value, detail, last = false }: { icon: React.ReactNode; label: string; value: string; detail: string; last?: boolean }) {
  return (
    <div className={`min-h-24 px-5 py-4 transition hover:bg-[#fbfcfe] ${last ? "" : "border-b border-[#e4e7ed] sm:border-r sm:border-b-0"}`}>
      <div className="flex items-center gap-2 text-[11px] font-bold text-[#737d90]">{icon} {label}</div>
      <div className="mt-2 flex items-end gap-2"><strong className="text-2xl leading-none">{value}</strong><span className="text-xs text-[#687287]">{detail}</span></div>
    </div>
  );
}

function TaskRow({ task, onToggle, onStar }: { task: Task; onToggle: (task: Task) => Promise<void>; onStar: (task: Task) => Promise<void> }) {
  return (
    <div id={`task-${task._id}`} className="group flex min-h-[52px] items-center gap-3 border-b border-[#eef0f4] px-3 transition duration-200 last:border-b-0 hover:bg-[#f8faff] md:px-4">
      <button className={`grid size-4 shrink-0 place-items-center rounded-full border transition hover:scale-110 ${task.completed ? "border-[#20b26b] bg-[#effcf5] text-[#20b26b]" : "border-[#b6c0cf] text-[#b6c0cf]"}`} onClick={() => void onToggle(task)} aria-label={task.completed ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`}>
        {task.completed ? <Check size={11} /> : <Circle size={8} />}
      </button>
      <span className={`min-w-0 flex-1 text-xs md:text-sm ${task.completed ? "text-[#8a92a0] line-through" : "text-[#596274]"}`}>{task.title}</span>
      <button onClick={() => void onStar(task)} className={`grid size-8 shrink-0 place-items-center transition hover:scale-110 ${task.starred ? "text-[#f4b740]" : "text-[#9aa7ba] hover:text-[#f4b740]"}`} aria-label={task.starred ? `Remove ${task.title} from revision list` : `Add ${task.title} to revision list`}>
        <Star size={16} fill={task.starred ? "currentColor" : "none"} />
      </button>
      <span className="w-20 text-right text-xs text-[#637087]">Est. {task.estimatedMinutes} min</span>
      <ChevronRight size={15} className="text-[#92a0b3] transition group-hover:translate-x-0.5 group-hover:text-[#2f7df6]" />
    </div>
  );
}

function ProgressLine({ label, value }: { label: string; value: string }) {
  return <div className="mb-3 flex items-center text-sm text-[#5f687a]"><span>{label}</span><strong className="ml-auto text-[#20232d]">{value}</strong></div>;
}
