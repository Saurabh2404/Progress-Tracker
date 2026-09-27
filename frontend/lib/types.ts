export type Sprint = {
  _id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  color: string;
  estimatedMinutes?: number;
  dayEstimates?: number[];
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
};
