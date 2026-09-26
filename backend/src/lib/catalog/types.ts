export type SprintSeed = {
  name: string;
  goal: string;
  startDate: Date;
  endDate: Date;
  color: string;
  estimatedMinutes: number;
  timeSpentSeconds?: number;
};

export type TaskSeed = {
  sourceKey: string;
  sprintName: string;
  title: string;
  notes: string;
  date: Date;
  dayNumber: number;
  difficulty: "Easy" | "Medium" | "Hard";
  estimatedMinutes: number;
  timeSpentSeconds?: number;
  completed?: boolean;
};
