export type SprintSeed = {
  name: string;
  goal: string;
  startDate: Date;
  endDate: Date;
  color: string;
  estimatedMinutes: number;
  dayEstimates: number[];
  timeSpentSeconds?: number;
};

export function createDayTasks(
  sprintNumber: number,
  dayNumber: number,
  month: number,
  day: number,
  tasks: Array<[title: string, estimatedMinutes: number]>,
): TaskSeed[] {
  return tasks.map(([title, estimatedMinutes], index) => ({
    sourceKey: `s${sprintNumber}-d${dayNumber}-${index + 1}`,
    order: index + 1,
    sprintName: `Sprint ${sprintNumber}`,
    title,
    notes: `Sprint ${sprintNumber} - Day ${dayNumber}`,
    date: new Date(2026, month - 1, day, 12, 0, 0, 0),
    dayNumber,
    difficulty: "Medium",
    estimatedMinutes,
  }));
}

export type TaskSeed = {
  sourceKey: string;
  order?: number;
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
