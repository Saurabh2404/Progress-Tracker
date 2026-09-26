import type { Sprint, Task } from "./types";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(payload.message ?? "Unable to save your changes.");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  eventsUrl: `${baseUrl}/events`,
  getSprints: () => request<Sprint[]>("/sprints"),
  createSprint: (payload: Omit<Sprint, "_id" | "taskCount" | "completedCount">) =>
    request<Sprint>("/sprints", { method: "POST", body: JSON.stringify(payload) }),
  deleteSprint: (id: string) => request<void>(`/sprints/${id}`, { method: "DELETE" }),
  getTasks: () => request<Task[]>("/tasks"),
  createTask: (payload: {
    sprintId: string;
    title: string;
    notes: string;
    date: string;
    difficulty: Task["difficulty"];
    estimatedMinutes: number;
  }) => request<Task>("/tasks", { method: "POST", body: JSON.stringify(payload) }),
  updateTask: (id: string, payload: Partial<Task>) =>
    request<Task>(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteTask: (id: string) => request<void>(`/tasks/${id}`, { method: "DELETE" }),
};
