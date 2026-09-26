"use client";

import {
  BarChart3,
  CalendarDays,
  Check,
  ChevronRight,
  CirclePlus,
  Clock3,
  Flame,
  LayoutDashboard,
  ListTodo,
  LoaderCircle,
  Menu,
  Plus,
  RefreshCw,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Sprint, Task } from "@/lib/types";

type View = "dashboard" | "sprints" | "tasks";

const colors = {
  ink: "#182522",
  muted: "#64716d",
  line: "#dfe5e2",
  paper: "#f7f8f6",
  green: "#245e55",
  greenDark: "#173d38",
  yellow: "#f4c95d",
  coral: "#d96d45",
};

const panel = "rounded-lg border border-[#dfe5e2] bg-white shadow-[0_18px_48px_rgba(29,52,47,0.08)]";
const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border-0 bg-[#245e55] px-[18px] font-bold whitespace-nowrap text-white shadow-[0_7px_18px_rgba(36,94,85,0.18)] transition-colors hover:bg-[#173d38] disabled:cursor-not-allowed disabled:opacity-[.55]";
const secondaryButton =
  "inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg border border-[#dfe5e2] bg-white px-[15px] font-bold whitespace-nowrap text-[#182522] transition-colors hover:border-[#245e55] hover:text-[#245e55] disabled:cursor-not-allowed disabled:opacity-[.55]";
const iconButton =
  "grid size-[38px] shrink-0 place-items-center rounded-lg border-0 bg-transparent p-0 text-[#64716d] transition-colors hover:bg-[#fae5dc] hover:text-[#d96d45]";
const eyebrow = "mb-1.5 block text-[0.72rem] font-extrabold uppercase text-[#64716d]";
const heading = "font-[family-name:var(--font-display)] text-2xl font-semibold text-[#182522]";
const field =
  "w-full rounded-md border border-[#cfd8d4] bg-white px-3 py-[11px] text-[#182522] outline-none focus:border-[#245e55] focus:ring-3 focus:ring-[#dcebe7]";

const dateKey = (value: Date | string) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const todayKey = () => dateKey(new Date());

const formatDate = (value: string, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-IN", options ?? { day: "numeric", month: "short" }).format(new Date(value));

const formatLongDate = (value: Date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  }).formatToParts(value);
  const byType = new Map(parts.map((part) => [part.type, part.value]));
  return `${byType.get("weekday")}, ${byType.get("day")} ${byType.get("month")}`;
};

const dayDiff = (future: string) => Math.ceil((new Date(future).getTime() - Date.now()) / 86_400_000);
const formatMinutes = (minutes = 0) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
const formatSeconds = (seconds = 0) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`;

export function Dashboard() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<View>("dashboard");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState("");
  const taskDialog = useRef<HTMLDialogElement>(null);
  const sprintDialog = useRef<HTMLDialogElement>(null);

  const loadData = useCallback(async () => {
    try {
      setError("");
      const [nextSprints, nextTasks] = await Promise.all([api.getSprints(), api.getTasks()]);
      setSprints(nextSprints);
      setTasks(nextTasks);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load your plan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const events = new EventSource(api.eventsUrl);
    let refreshTimer: number | undefined;
    const refresh = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => void loadData(), 150);
    };
    events.addEventListener("refresh", refresh);
    return () => {
      window.clearTimeout(refreshTimer);
      events.close();
    };
  }, [loadData]);

  const activeSprint = useMemo(() => {
    const now = Date.now();
    return (
      sprints.find(
        (sprint) => new Date(sprint.startDate).getTime() <= now && new Date(sprint.endDate).getTime() >= now,
      ) ?? sprints[0]
    );
  }, [sprints]);

  const todayTasks = tasks.filter((task) => dateKey(task.date) === todayKey());
  const completeToday = todayTasks.filter((task) => task.completed).length;
  const totalMinutes = todayTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const completedTasks = tasks.filter((task) => task.completed).length;
  const overallProgress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const daysLeft = activeSprint ? Math.max(0, dayDiff(activeSprint.endDate)) : 0;

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  async function toggleTask(task: Task) {
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
      notify(task.completed ? "Task moved back to your list" : "Nice work. Task completed.");
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : "Could not update task");
    }
  }

  async function removeTask(id: string) {
    const task = tasks.find((item) => item._id === id);
    if (!task || !window.confirm("Delete this task?")) return;
    await api.deleteTask(id);
    setTasks((current) => current.filter((item) => item._id !== id));
    setSprints((current) =>
      current.map((sprint) =>
        sprint._id === task.sprintId._id
          ? {
              ...sprint,
              taskCount: sprint.taskCount - 1,
              completedCount: sprint.completedCount - (task.completed ? 1 : 0),
            }
          : sprint,
      ),
    );
    notify("Task deleted");
  }

  async function removeSprint(id: string) {
    if (!window.confirm("Delete this sprint and all of its tasks?")) return;
    await api.deleteSprint(id);
    setSprints((current) => current.filter((item) => item._id !== id));
    setTasks((current) => current.filter((task) => task.sprintId._id !== id));
    notify("Sprint deleted");
  }

  return (
    <div className="min-h-screen bg-[#f7f8f6] font-[family-name:var(--font-sans)] text-[#182522]">
      {menuOpen && (
        <button
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-[236px] flex-col bg-[#173d38] px-[22px] py-[30px] text-[#eef8f5] shadow-2xl transition-transform md:translate-x-0 md:shadow-none ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-3 text-[0.95rem] leading-tight">
          <span className="grid size-[42px] place-items-center rounded-lg bg-[#f4c95d] text-[#173d38]">
            <BarChart3 size={20} />
          </span>
          <span>
            Upgrading
            <br />
            <b className="font-[family-name:var(--font-display)] text-2xl font-semibold">Skills</b>
          </span>
        </div>
        <button
          className={`${iconButton} absolute top-6 right-4 text-white md:hidden`}
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation"
        >
          <X />
        </button>
        <nav className="mt-14 grid gap-2" aria-label="Main navigation">
          <NavButton
            active={view === "dashboard"}
            icon={<LayoutDashboard />}
            label="Overview"
            onClick={() => {
              setView("dashboard");
              setMenuOpen(false);
            }}
          />
          <NavButton
            active={view === "sprints"}
            icon={<Target />}
            label="Sprints"
            onClick={() => {
              setView("sprints");
              setMenuOpen(false);
            }}
          />
          <NavButton
            active={view === "tasks"}
            icon={<ListTodo />}
            label="All tasks"
            onClick={() => {
              setView("tasks");
              setMenuOpen(false);
            }}
          />
        </nav>
        <div className="mt-auto flex items-center gap-3 border-t border-white/12 pt-4">
          <div className="grid size-9 place-items-center rounded-full bg-white/10 text-[#d96d45]">
            <Flame size={18} />
          </div>
          <div>
            <strong className="text-sm">{Math.max(1, completeToday)} day streak</strong>
            <span className="mt-0.5 block text-xs text-[#9fb5af]">Keep the rhythm going</span>
          </div>
        </div>
      </aside>

      <main className="min-h-screen md:ml-[236px]">
        <header className="flex min-h-[92px] items-center gap-[18px] border-b border-[#dfe5e2] bg-[#f7f8f6]/95 px-[18px] py-[18px] backdrop-blur-md md:min-h-28 md:px-[clamp(24px,4vw,58px)] md:py-6">
          <button className={`${iconButton} md:hidden`} onClick={() => setMenuOpen(true)} aria-label="Open navigation">
            <Menu />
          </button>
          <div className="mr-auto min-w-0">
            <p className="mb-1 hidden text-xs font-bold text-[#64716d] uppercase md:block">
              {formatLongDate(new Date())}
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-2xl leading-tight font-semibold md:text-[2.65rem]">
              {view === "dashboard" ? "Your study desk" : view === "sprints" ? "Your sprints" : "All tasks"}
            </h1>
          </div>
          <button
            className={`${primaryButton} size-[42px] px-0 text-[0px] md:size-auto md:px-[18px] md:text-base`}
            onClick={() => taskDialog.current?.showModal()}
            disabled={!sprints.length}
          >
            <Plus size={18} />
            <span className="hidden md:inline">Add task</span>
          </button>
        </header>

        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} retry={loadData} />
        ) : (
          <>
            {view === "dashboard" && (
              <DashboardView
                activeSprint={activeSprint}
                todayTasks={todayTasks}
                completeToday={completeToday}
                totalMinutes={totalMinutes}
                overallProgress={overallProgress}
                daysLeft={daysLeft}
                tasks={tasks}
                sprints={sprints}
                toggleTask={toggleTask}
                removeTask={removeTask}
                showTasks={() => setView("tasks")}
                addSprint={() => sprintDialog.current?.showModal()}
              />
            )}
            {view === "sprints" && (
              <SprintsView sprints={sprints} onAdd={() => sprintDialog.current?.showModal()} onDelete={removeSprint} />
            )}
            {view === "tasks" && <TasksView tasks={tasks} toggleTask={toggleTask} removeTask={removeTask} />}
          </>
        )}
      </main>

      <TaskDialog
        ref={taskDialog}
        sprints={sprints}
        onCreated={(task) => {
          setTasks((current) => [...current, task]);
          setSprints((current) =>
            current.map((sprint) =>
              sprint._id === task.sprintId._id ? { ...sprint, taskCount: sprint.taskCount + 1 } : sprint,
            ),
          );
          notify("Task added to your plan");
        }}
      />
      <SprintDialog
        ref={sprintDialog}
        onCreated={(sprint) => {
          setSprints((current) => [...current, sprint].sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate)));
          notify("Sprint created");
        }}
      />
      {toast && (
        <div
          className="fixed right-6 bottom-6 z-50 flex min-h-12 items-center gap-2 rounded-lg bg-[#173d38] px-4 text-sm font-bold text-white shadow-xl"
          role="status"
        >
          <Check size={17} /> {toast}
        </div>
      )}
    </div>
  );
}

function NavButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`flex min-h-[46px] w-full items-center gap-3 rounded-lg border-0 px-3.5 text-left transition-colors [&_svg]:size-[19px] ${active ? "bg-white/10 text-white shadow-[inset_3px_0_#f4c95d]" : "bg-transparent text-[#b9cbc6] hover:bg-white/10 hover:text-white"}`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function DashboardView({
  activeSprint,
  todayTasks,
  completeToday,
  totalMinutes,
  overallProgress,
  daysLeft,
  tasks,
  sprints,
  toggleTask,
  removeTask,
  showTasks,
  addSprint,
}: {
  activeSprint?: Sprint;
  todayTasks: Task[];
  completeToday: number;
  totalMinutes: number;
  overallProgress: number;
  daysLeft: number;
  tasks: Task[];
  sprints: Sprint[];
  toggleTask: (task: Task) => void;
  removeTask: (id: string) => void;
  showTasks: () => void;
  addSprint: () => void;
}) {
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + index);
    const dayTasks = tasks.filter((task) => dateKey(task.date) === dateKey(date));
    return {
      label: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date).slice(0, 1),
      value: dayTasks.length
        ? Math.round((dayTasks.filter((task) => task.completed).length / dayTasks.length) * 100)
        : 0,
      today: index === 6,
    };
  });

  return (
    <div className="px-4 py-[22px] pb-10 md:px-[clamp(24px,4vw,58px)] md:py-[30px] md:pb-[54px]">
      <section className="mb-[18px] grid grid-cols-1 gap-2 lg:grid-cols-3 lg:gap-3.5" aria-label="Progress summary">
        <Metric
          icon={<Target />}
          label="Overall progress"
          value={`${overallProgress}%`}
          detail={`${tasks.filter((task) => task.completed).length} of ${tasks.length} tasks`}
          accent="green"
        />
        <Metric
          icon={<CalendarDays />}
          label="Days left"
          value={String(daysLeft)}
          detail={activeSprint?.name ?? "No active sprint"}
          accent="yellow"
        />
        <Metric
          icon={<Check />}
          label="Done today"
          value={`${completeToday}/${todayTasks.length}`}
          detail={`${totalMinutes} min planned`}
          accent="coral"
        />
      </section>

      <div className="grid items-start gap-[18px] xl:grid-cols-[minmax(0,1.75fr)_minmax(280px,.85fr)]">
        <section className={`${panel} p-5 md:p-[26px]`}>
          <SectionHeading eyebrowText="Today" title="Make today count">
            <button
              className="inline-flex items-center gap-1 bg-transparent font-bold text-[#245e55]"
              onClick={showTasks}
            >
              View all <ChevronRight size={16} />
            </button>
          </SectionHeading>
          <div className="my-6 flex items-center gap-5">
            <div className="grid min-w-[72px]">
              <strong className="font-[family-name:var(--font-display)] text-[1.6rem] leading-none">
                {todayTasks.length ? Math.round((completeToday / todayTasks.length) * 100) : 0}%
              </strong>
              <span className="text-xs text-[#64716d]">daily goal</span>
            </div>
            <ProgressBar value={todayTasks.length ? (completeToday / todayTasks.length) * 100 : 0} />
          </div>
          <div className="mt-2">
            {todayTasks.length ? (
              todayTasks.map((task) => (
                <TaskRow key={task._id} task={task} toggleTask={toggleTask} removeTask={removeTask} />
              ))
            ) : (
              <EmptyState title="A clear slate" text="Add a task and give today a direction." />
            )}
          </div>
        </section>

        <aside className="grid gap-[18px] md:grid-cols-2 xl:grid-cols-1">
          <section className={`${panel} p-6`}>
            <SectionHeading eyebrowText="Current sprint" title={activeSprint?.name ?? "Plan your first sprint"}>
              <span className="rounded-md bg-[#fff2c7] px-2.5 py-1.5 text-xs font-extrabold text-[#8d6700]">
                {daysLeft} days
              </span>
            </SectionHeading>
            {activeSprint ? (
              <>
                <p className="my-[18px] mb-6 text-sm leading-relaxed text-[#64716d]">{activeSprint.goal}</p>
                <div>
                  <div className="mb-2 flex justify-between text-xs text-[#64716d]">
                    <span>Progress</span>
                    <strong className="text-[#182522]">
                      {activeSprint.taskCount
                        ? Math.round((activeSprint.completedCount / activeSprint.taskCount) * 100)
                        : 0}
                      %
                    </strong>
                  </div>
                  <ProgressBar
                    value={activeSprint.taskCount ? (activeSprint.completedCount / activeSprint.taskCount) * 100 : 0}
                    color={activeSprint.color}
                  />
                  <div className="mt-2 flex justify-between text-xs text-[#64716d]">
                    <span>{formatDate(activeSprint.startDate)}</span>
                    <span>{formatDate(activeSprint.endDate)}</span>
                  </div>
                </div>
              </>
            ) : (
              <button className={`${secondaryButton} mt-5`} onClick={addSprint}>
                <CirclePlus size={18} /> Create sprint
              </button>
            )}
          </section>

          <section className={`${panel} p-6`}>
            <SectionHeading eyebrowText="Last 7 days" title="Consistency">
              <strong>{week.filter((day) => day.value > 0).length}/7</strong>
            </SectionHeading>
            <div className="mt-5 grid h-[142px] grid-cols-7 gap-2">
              {week.map((day, index) => (
                <div className="grid grid-rows-[1fr_auto] gap-2 text-center" key={index}>
                  <div className="flex items-end overflow-hidden rounded bg-[#edf1ef]">
                    <span className="w-full rounded-t bg-[#245e55]" style={{ height: `${Math.max(6, day.value)}%` }} />
                  </div>
                  <b className={`text-[0.69rem] ${day.today ? "text-[#d96d45]" : "text-[#64716d]"}`}>{day.label}</b>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <section className="mt-[18px] block gap-[30px] rounded-lg border border-[#dfe5e2] bg-white px-[26px] py-[23px] lg:flex lg:items-start lg:justify-between">
        <div>
          <span className={eyebrow}>Roadmap</span>
          <h2 className={heading}>Upcoming sprints</h2>
        </div>
        <div className="mt-5 grid w-full grid-cols-2 gap-x-6 gap-y-[18px] lg:mt-0 lg:w-[78%] lg:grid-cols-4">
          {sprints.map((sprint, index) => (
            <div className="flex min-w-0 items-center gap-2.5" key={sprint._id}>
              <span
                className="grid size-[35px] shrink-0 place-items-center rounded-md text-xs font-extrabold text-white"
                style={{ background: sprint.color }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="grid min-w-0 gap-0.5">
                <strong className="truncate text-[0.82rem]">{sprint.name}</strong>
                <small className="truncate text-[0.7rem] text-[#64716d]">
                  {formatMinutes(sprint.estimatedMinutes)} planned
                </small>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeading({
  eyebrowText,
  title,
  children,
}: {
  eyebrowText: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-[18px]">
      <div>
        <span className={eyebrow}>{eyebrowText}</span>
        <h2 className={heading}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ProgressBar({ value, color = colors.green }: { value: number; color?: string }) {
  return (
    <div className="h-[7px] w-full overflow-hidden rounded-full bg-[#e9eeec]">
      <span
        className="block h-full rounded-[inherit] transition-[width] duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  detail,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  accent: "green" | "yellow" | "coral";
}) {
  const accents = {
    green: "bg-[#dcebe7] text-[#245e55]",
    yellow: "bg-[#fff2c7] text-[#8d6700]",
    coral: "bg-[#fae5dc] text-[#d96d45]",
  };
  return (
    <div className="flex min-h-[88px] items-center gap-3.5 rounded-lg border border-[#dfe5e2] bg-white px-4 py-3 lg:min-h-[126px] lg:gap-[17px] lg:p-5">
      <span className={`grid size-[38px] shrink-0 place-items-center rounded-lg lg:size-11 ${accents[accent]}`}>
        {icon}
      </span>
      <div className="grid">
        <span className="text-xs font-semibold text-[#64716d]">{label}</span>
        <strong className="my-0.5 font-[family-name:var(--font-display)] text-2xl leading-none font-semibold lg:text-[2rem]">
          {value}
        </strong>
        <small className="text-xs font-semibold text-[#64716d]">{detail}</small>
      </div>
    </div>
  );
}

function TaskRow({
  task,
  toggleTask,
  removeTask,
}: {
  task: Task;
  toggleTask: (task: Task) => void;
  removeTask: (id: string) => void;
}) {
  const duration =
    task.completed && task.timeSpentSeconds ? formatSeconds(task.timeSpentSeconds) : `${task.estimatedMinutes}m`;
  const difficulty = {
    Easy: "bg-[#dcebe7] text-[#27695e]",
    Medium: "bg-[#fff2c7] text-[#8a6500]",
    Hard: "bg-[#fae5dc] text-[#a14625]",
  }[task.difficulty];
  return (
    <div className="grid min-h-[76px] grid-cols-[28px_minmax(0,1fr)_34px] items-center gap-3 border-t border-[#dfe5e2] py-3 md:grid-cols-[30px_minmax(0,1fr)_auto_auto_34px] md:py-0">
      <button
        className={`grid size-6 place-items-center rounded-full border-2 p-0 text-white ${task.completed ? "border-[#245e55] bg-[#245e55]" : "border-[#b7c2be] bg-white"}`}
        onClick={() => toggleTask(task)}
        aria-label={task.completed ? "Mark task incomplete" : "Mark task complete"}
      >
        {task.completed && <Check size={16} />}
      </button>
      <div className="grid min-w-0 gap-1.5">
        <strong className={`truncate text-sm ${task.completed ? "text-[#87918e] line-through" : ""}`}>
          {task.title}
        </strong>
        <span className="flex items-center gap-1.5 text-xs text-[#64716d]">
          <i className="size-[7px] rounded-full" style={{ background: task.sprintId.color }} />
          {task.sprintId.name} - Day {task.dayNumber ?? 1}
        </span>
      </div>
      <span
        className={`hidden min-w-16 rounded px-2 py-1 text-center text-[0.7rem] font-extrabold md:block ${difficulty}`}
      >
        {task.difficulty}
      </span>
      <span className="hidden items-center gap-1 text-xs text-[#64716d] md:flex">
        <Clock3 size={15} /> {duration}
      </span>
      <button
        className={iconButton}
        onClick={() => removeTask(task._id)}
        aria-label={`Delete ${task.title}`}
        title="Delete task"
      >
        <Trash2 size={17} />
      </button>
    </div>
  );
}

function SprintsView({
  sprints,
  onAdd,
  onDelete,
}: {
  sprints: Sprint[];
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="px-4 py-[22px] pb-10 md:px-[clamp(24px,4vw,58px)] md:py-[30px] md:pb-[54px]">
      <div className="mb-[22px] flex items-end justify-between gap-[18px]">
        <div>
          <span className={eyebrow}>Your roadmap</span>
          <h2 className={heading}>{sprints.length} focused sprints</h2>
        </div>
        <button className={secondaryButton} onClick={onAdd}>
          <Plus size={18} /> New sprint
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {sprints.map((sprint, index) => {
          const progress = sprint.taskCount ? Math.round((sprint.completedCount / sprint.taskCount) * 100) : 0;
          return (
            <article className="min-h-[260px] rounded-lg border border-[#dfe5e2] bg-white p-[22px]" key={sprint._id}>
              <div className="mb-7 flex justify-between">
                <span
                  className="grid size-[35px] place-items-center rounded-md text-xs font-extrabold text-white"
                  style={{ background: sprint.color }}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <button
                  className={iconButton}
                  onClick={() => onDelete(sprint._id)}
                  aria-label={`Delete ${sprint.name}`}
                  title="Delete sprint"
                >
                  <Trash2 size={17} />
                </button>
              </div>
              <span className={eyebrow}>
                {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
              </span>
              <h3 className="my-2 font-[family-name:var(--font-display)] text-2xl font-semibold">{sprint.name}</h3>
              <p className="min-h-[68px] text-sm leading-relaxed text-[#64716d]">
                {formatMinutes(sprint.estimatedMinutes)} planned
              </p>
              <div className="mb-2 flex justify-between text-xs text-[#64716d]">
                <span>
                  {sprint.completedCount}/{sprint.taskCount} tasks
                </span>
                <strong className="text-[#182522]">{progress}%</strong>
              </div>
              <ProgressBar value={progress} color={sprint.color} />
            </article>
          );
        })}
      </div>
    </div>
  );
}

function TasksView({
  tasks,
  toggleTask,
  removeTask,
}: {
  tasks: Task[];
  toggleTask: (task: Task) => void;
  removeTask: (id: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const visible = tasks.filter((task) => filter === "all" || (filter === "done" ? task.completed : !task.completed));
  return (
    <div className="px-4 py-[22px] pb-10 md:px-[clamp(24px,4vw,58px)] md:py-[30px] md:pb-[54px]">
      <div className="mb-[22px] flex items-end justify-between gap-[18px]">
        <div>
          <span className={eyebrow}>Task library</span>
          <h2 className={heading}>{visible.length} items in view</h2>
        </div>
        <div className="flex rounded-lg border border-[#dfe5e2] bg-white p-[3px]" aria-label="Filter tasks">
          {(["all", "open", "done"] as const).map((item) => (
            <button
              className={`min-h-[34px] rounded-md border-0 px-3 capitalize ${filter === item ? "bg-[#245e55] text-white" : "bg-transparent text-[#64716d]"}`}
              key={item}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <section className={`${panel} px-[18px] py-0 md:px-6`}>
        {visible.length ? (
          visible.map((task) => (
            <div
              key={task._id}
              className="grid grid-cols-1 border-t border-[#dfe5e2] pt-3 first:border-t-0 md:grid-cols-[72px_1fr] md:items-center md:pt-0"
            >
              <span className="text-xs font-extrabold text-[#64716d] uppercase">
                {formatDate(task.date, { day: "2-digit", month: "short" })}
              </span>
              <TaskRow task={task} toggleTask={toggleTask} removeTask={removeTask} />
            </div>
          ))
        ) : (
          <EmptyState title="Nothing here" text="Change the filter or add a task." />
        )}
      </section>
    </div>
  );
}

function TaskDialog({
  ref,
  sprints,
  onCreated,
}: {
  ref: React.RefObject<HTMLDialogElement | null>;
  sprints: Sprint[];
  onCreated: (task: Task) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      const task = await api.createTask({
        sprintId: String(data.get("sprintId")),
        title: String(data.get("title")),
        notes: String(data.get("notes")),
        date: String(data.get("date")),
        difficulty: String(data.get("difficulty")) as Task["difficulty"],
        estimatedMinutes: Number(data.get("estimatedMinutes")),
      });
      onCreated(task);
      event.currentTarget.reset();
      ref.current?.close();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to add task");
    } finally {
      setSaving(false);
    }
  }
  return (
    <dialog
      ref={ref}
      className="m-auto max-h-[90vh] w-[min(560px,calc(100%_-_28px))] rounded-lg border-0 bg-white p-0 text-[#182522] shadow-[0_30px_90px_rgba(16,39,35,0.25)] backdrop:bg-[#0d1e1b]/65 backdrop:backdrop-blur-sm"
    >
      <form className="grid gap-[17px] p-7" onSubmit={submit}>
        <DialogHeader eyebrowText="Plan the work" title="Add a task" close={() => ref.current?.close()} />
        <Field label="Task name">
          <input className={field} name="title" placeholder="e.g. Solve 3 array problems" required />
        </Field>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label="Sprint">
            <select className={field} name="sprintId" required defaultValue={sprints[0]?._id}>
              {sprints.map((sprint) => (
                <option value={sprint._id} key={sprint._id}>
                  {sprint.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input className={field} name="date" type="date" defaultValue={todayKey()} required />
          </Field>
          <Field label="Difficulty">
            <select className={field} name="difficulty" defaultValue="Medium">
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </Field>
          <Field label="Minutes">
            <input
              className={field}
              name="estimatedMinutes"
              type="number"
              min="5"
              max="480"
              step="5"
              defaultValue="45"
              required
            />
          </Field>
        </div>
        <Field label="Notes">
          <textarea className={field} name="notes" placeholder="Optional context or focus point" rows={3} />
        </Field>
        {message && <p className="m-0 text-sm text-[#a63e26]">{message}</p>}
        <button className={`${primaryButton} mt-1 w-full`} disabled={saving}>
          {saving ? <LoaderCircle className="animate-spin" size={18} /> : <Plus size={18} />}{" "}
          {saving ? "Adding..." : "Add task"}
        </button>
      </form>
    </dialog>
  );
}

function SprintDialog({
  ref,
  onCreated,
}: {
  ref: React.RefObject<HTMLDialogElement | null>;
  onCreated: (sprint: Sprint) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    try {
      const sprint = await api.createSprint({
        name: String(data.get("name")),
        goal: String(data.get("goal")),
        startDate: String(data.get("startDate")),
        endDate: String(data.get("endDate")),
        color: String(data.get("color")),
        estimatedMinutes: Number(data.get("estimatedMinutes")),
      });
      onCreated(sprint);
      event.currentTarget.reset();
      ref.current?.close();
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Unable to create sprint");
    } finally {
      setSaving(false);
    }
  }
  return (
    <dialog
      ref={ref}
      className="m-auto max-h-[90vh] w-[min(560px,calc(100%_-_28px))] rounded-lg border-0 bg-white p-0 text-[#182522] shadow-[0_30px_90px_rgba(16,39,35,0.25)] backdrop:bg-[#0d1e1b]/65 backdrop:backdrop-blur-sm"
    >
      <form className="grid gap-[17px] p-7" onSubmit={submit}>
        <DialogHeader eyebrowText="Shape the next chapter" title="Create a sprint" close={() => ref.current?.close()} />
        <Field label="Sprint name">
          <input className={field} name="name" placeholder="e.g. Graph foundations" required />
        </Field>
        <Field label="Goal">
          <textarea className={field} name="goal" placeholder="What will be different by the end?" rows={3} required />
        </Field>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label="Starts">
            <input className={field} name="startDate" type="date" defaultValue={todayKey()} required />
          </Field>
          <Field label="Ends">
            <input className={field} name="endDate" type="date" required />
          </Field>
          <Field label="Planned minutes">
            <input className={field} name="estimatedMinutes" type="number" min="0" defaultValue="0" />
          </Field>
        </div>
        <Field label="Color">
          <input
            className="h-[42px] w-[58px] rounded-md border border-[#cfd8d4] bg-white p-1"
            name="color"
            type="color"
            defaultValue="#2f6f65"
          />
        </Field>
        {message && <p className="m-0 text-sm text-[#a63e26]">{message}</p>}
        <button className={`${primaryButton} mt-1 w-full`} disabled={saving}>
          {saving ? <LoaderCircle className="animate-spin" size={18} /> : <Plus size={18} />}{" "}
          {saving ? "Creating..." : "Create sprint"}
        </button>
      </form>
    </dialog>
  );
}

function DialogHeader({ eyebrowText, title, close }: { eyebrowText: string; title: string; close: () => void }) {
  return (
    <div className="mb-1 flex items-start justify-between">
      <div>
        <span className={eyebrow}>{eyebrowText}</span>
        <h2 className={heading}>{title}</h2>
      </div>
      <button type="button" className={iconButton} onClick={close} aria-label="Close">
        <X />
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-xs font-extrabold text-[#182522]">
      {label}
      {children}
    </label>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center text-center text-[#64716d]">
      <CirclePlus className="mb-2.5 text-[#aab7b3]" />
      <strong className="text-[#182522]">{title}</strong>
      <span className="mt-1 text-xs">{text}</span>
    </div>
  );
}
function LoadingState() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-center text-[#64716d]">
      <LoaderCircle className="animate-spin" />
      <p>Loading your plan...</p>
    </div>
  );
}
function ErrorState({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 text-center text-[#64716d]">
      <strong className="font-[family-name:var(--font-display)] text-2xl text-[#182522]">
        Could not reach your workspace
      </strong>
      <p className="mb-3">{message}</p>
      <button className={secondaryButton} onClick={retry}>
        <RefreshCw size={17} /> Try again
      </button>
    </div>
  );
}
