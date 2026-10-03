"use client";

import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Coffee, LoaderCircle } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { PlanSettings, SessionUser, Sprint, Task } from "@/lib/types";
import { DashboardHeader } from "./dashboard/DashboardHeader";
import { DashboardOverview } from "./dashboard/DashboardOverview";
import { DashboardSidebar } from "./dashboard/DashboardSidebar";
import { PlanDialog } from "./dashboard/PlanDialog";
import { SprintBoard } from "./dashboard/SprintBoard";
import { dateKey } from "./dashboard/utils";

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
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const loadData = useCallback(async () => {
    try {
      const [nextSprints, nextTasks, nextSettings, nextUser] = await Promise.all([api.getSprints(), api.getTasks(), api.getSettings(), api.getSession()]);
      setSprints(nextSprints); setTasks(nextTasks); setSettings(nextSettings); setUser(nextUser);
      const today = new Date();
      const current = nextSprints.find((sprint) => new Date(sprint.startDate) <= today && new Date(sprint.endDate) >= today) ?? nextSprints[0];
      if (current) {
        setOpenSprints(new Set([current._id]));
        const currentTask = nextTasks.find((task) => task.sprintId._id === current._id && dateKey(task.date) === dateKey(today));
        setOpenDays(new Set([`${current._id}:${currentTask?.dayNumber ?? 1}`]));
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to load your plan."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);
  useEffect(() => {
    const saved = window.localStorage.getItem("dashboard-theme");
    const nextTheme = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light";
    setTheme(nextTheme); document.documentElement.classList.toggle("dark", nextTheme === "dark");
    const clearSearch = (event: KeyboardEvent) => event.key === "Escape" && setQuery("");
    window.addEventListener("keydown", clearSearch); return () => window.removeEventListener("keydown", clearSearch);
  }, []);
  useEffect(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return;
    const matches = tasks.filter((task) => task.title.toLowerCase().includes(normalizedQuery));
    setOpenSprints((current) => new Set([...current, ...matches.map((task) => task.sprintId._id)]));
    setOpenDays((current) => new Set([...current, ...matches.map((task) => `${task.sprintId._id}:${task.dayNumber ?? 1}`)]));
  }, [query, tasks]);

  const now = useMemo(() => new Date(), []);
  const activeSprint = sprints.find((sprint) => new Date(sprint.startDate) <= now && new Date(sprint.endDate) >= now) ?? sprints[0];
  const todayTasks = tasks.filter((task) => dateKey(task.date) === dateKey(now));
  const completedTasks = tasks.filter((task) => task.completed);
  const starredTasks = tasks.filter((task) => task.starred);
  const currentTask = todayTasks.find((task) => !task.completed) ?? tasks.find((task) => !task.completed);
  const completedDays = new Set(completedTasks.map((task) => dateKey(task.date))).size;
  const completedSprints = sprints.filter((sprint) => sprint.taskCount > 0 && sprint.taskCount === sprint.completedCount).length;
  const overallProgress = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const dayCompleted = todayTasks.filter((task) => task.completed).length;
  const dayMinutes = todayTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const daySpentMinutes = todayTasks.filter((task) => task.completed).reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const dayProgress = todayTasks.length ? Math.round((dayCompleted / todayTasks.length) * 100) : 0;
  const totalSpentMinutes = completedTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const totalPlanned = sprints.reduce((sum, sprint) => sum + (sprint.estimatedMinutes ?? 0), 0);

  function toggleSet(setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) {
    setter((current) => { const next = new Set(current); next.has(key) ? next.delete(key) : next.add(key); return next; });
  }
  async function toggleTask(task: Task) {
    const previous = tasks; const completed = !task.completed;
    setTasks((current) => current.map((item) => item._id === task._id ? { ...item, completed } : item));
    try {
      const updated = await api.updateTask(task._id, { completed });
      setTasks((current) => current.map((item) => item._id === updated._id ? updated : item));
      setSprints((current) => current.map((sprint) => sprint._id === task.sprintId._id ? { ...sprint, completedCount: sprint.completedCount + (completed ? 1 : -1) } : sprint));
    } catch (error) { setTasks(previous); setMessage(error instanceof Error ? error.message : "Could not save progress."); }
  }
  async function toggleStar(task: Task) {
    const previous = tasks; const starred = !task.starred;
    setTasks((current) => current.map((item) => item._id === task._id ? { ...item, starred } : item));
    try { const updated = await api.updateTask(task._id, { starred }); setTasks((current) => current.map((item) => item._id === updated._id ? updated : item)); }
    catch (error) { setTasks(previous); setMessage(error instanceof Error ? error.message : "Could not update the revision list."); }
  }
  function openTask(task: Task) {
    setOpenSprints((current) => new Set(current).add(task.sprintId._id));
    setOpenDays((current) => new Set(current).add(`${task.sprintId._id}:${task.dayNumber ?? 1}`));
    window.setTimeout(() => document.getElementById(`task-${task._id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 350);
  }
  function openPlanDialog() { if (settings) { setPlanName(settings.planName); setCompletionDate(dateKey(settings.completionDate)); setPlanDialogOpen(true); } }
  async function savePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSavingSettings(true);
    try { const updated = await api.updateSettings({ planName, completionDate: new Date(`${completionDate}T12:00:00`).toISOString() }); setSettings(updated); setPlanDialogOpen(false); setMessage("Plan details updated."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not update the plan."); }
    finally { setSavingSettings(false); }
  }
  async function toggleBreak() {
    if (!settings || savingSettings) return; setSavingSettings(true);
    try { const updated = await api.updateSettings({ isOnBreak: !settings.isOnBreak }); setSettings(updated); setMessage(updated.isOnBreak ? "Break started. Your progress is saved." : "Welcome back. Your plan is active."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Could not update break status."); }
    finally { setSavingSettings(false); }
  }
  function toggleTheme() { setTheme((current) => { const next = current === "dark" ? "light" : "dark"; document.documentElement.classList.toggle("dark", next === "dark"); window.localStorage.setItem("dashboard-theme", next); return next; }); }
  async function logout() { await api.logout(); window.location.assign("/login"); }

  if (loading) return <main className="grid min-h-screen place-items-center bg-slate-50 text-slate-500 dark:bg-[#0c0f14] dark:text-slate-400"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-sm font-bold"><LoaderCircle className="animate-spin text-blue-500" size={22} /> Loading your plan</motion.div></main>;

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-[#f7f8fb] bg-[linear-gradient(rgba(80,100,130,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(80,100,130,0.035)_1px,transparent_1px)] bg-[size:48px_48px] font-[family-name:var(--font-sans)] text-slate-900 transition-colors dark:bg-[#090d12] dark:bg-[linear-gradient(rgba(110,140,180,0.065)_1px,transparent_1px),linear-gradient(90deg,rgba(110,140,180,0.065)_1px,transparent_1px)] dark:text-slate-100">
      <DashboardHeader email={user?.email ?? ""} query={query} theme={theme} onQueryChange={setQuery} onThemeToggle={toggleTheme} onLogout={() => void logout()} />
      <main className="mx-auto grid max-w-[1900px] grid-cols-1 gap-5 p-3 md:p-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <DashboardOverview settings={settings} activeSprint={activeSprint} overallProgress={overallProgress} completedDays={completedDays} totalSpentMinutes={totalSpentMinutes} totalPlanned={totalPlanned} completedSprints={completedSprints} sprintCount={sprints.length} saving={savingSettings} onEdit={openPlanDialog} onToggleBreak={() => void toggleBreak()} />
          <AnimatePresence>{settings?.isOnBreak && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-5 overflow-hidden"><div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200"><Coffee size={18} /><strong>Plan paused</strong><span className="hidden text-blue-600 sm:inline dark:text-blue-300">Your saved progress and revision list are unchanged.</span><button onClick={() => void toggleBreak()} className="ml-auto font-bold">Resume</button></div></motion.div>}</AnimatePresence>
          <SprintBoard sprints={sprints} tasks={tasks} activeSprint={activeSprint} openSprints={openSprints} openDays={openDays} query={query} onToggleSprint={(id) => toggleSet(setOpenSprints, id)} onToggleDay={(key) => toggleSet(setOpenDays, key)} onToggleTask={toggleTask} onStarTask={toggleStar} />
        </div>
        <DashboardSidebar settings={settings} now={now} tasks={tasks} todayTasks={todayTasks} starredTasks={starredTasks} currentTask={currentTask} revisionExpanded={revisionExpanded} dayCompleted={dayCompleted} daySpentMinutes={daySpentMinutes} dayMinutes={dayMinutes} dayProgress={dayProgress} onToggleRevision={() => setRevisionExpanded((current) => !current)} onOpenTask={openTask} onToggleTask={toggleTask} onStarTask={toggleStar} />
      </main>
      <PlanDialog open={planDialogOpen} planName={planName} completionDate={completionDate} saving={savingSettings} onPlanNameChange={setPlanName} onCompletionDateChange={setCompletionDate} onClose={() => setPlanDialogOpen(false)} onSubmit={savePlan} />
      <AnimatePresence>{message && <motion.button initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="fixed right-5 bottom-5 z-[80] rounded-md bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-xl dark:bg-white dark:text-slate-900" onClick={() => setMessage("")}>{message}</motion.button>}</AnimatePresence>
    </div>
    </MotionConfig>
  );
}
