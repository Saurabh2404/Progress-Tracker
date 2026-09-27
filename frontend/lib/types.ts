export type Sprint = {
  _id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  color: string;
  estimatedMinutes?: number;
  dayEstimates?: Array<number | null>;
  timeSpentSeconds?: number;
  taskCount: number;
  completedCount: number;
};

export type Task = {
  _id: string;
  sprintId: { _id: string; name: string; color: string };
  title: string;
  notes: string;
  date: string;
  dayNumber?: number;
  difficulty: "Easy" | "Medium" | "Hard";
  estimatedMinutes: number;
  timeSpentSeconds?: number;
  completed: boolean;
  starred: boolean;
};

export type PlanSettings = {
  _id: string;
  planName: string;
  startDate: string;
  completionDate: string;
  isOnBreak: boolean;
  breakStartedAt?: string | null;
};

export type SessionUser = {
  email: string;
};
