import { z } from "zod";

const dateString = z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date");

export const sprintInput = z
  .object({
    name: z.string().trim().min(1).max(80),
    goal: z.string().trim().min(1).max(240),
    startDate: dateString,
    endDate: dateString,
    color: z
      .string()
      .regex(/^#[0-9a-fA-F]{6}$/)
      .default("#2f6f65"),
    estimatedMinutes: z.coerce.number().int().min(0).max(100_000).default(0),
  })
  .refine((value) => new Date(value.endDate) >= new Date(value.startDate), {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export const taskInput = z.object({
  sprintId: z.string().min(1),
  title: z.string().trim().min(1).max(140),
  notes: z.string().trim().max(500).default(""),
  date: dateString,
  dayNumber: z.coerce.number().int().min(1).max(365).default(1),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).default("Medium"),
  estimatedMinutes: z.coerce.number().int().min(5).max(480).default(45),
  timeSpentSeconds: z.coerce.number().int().min(0).default(0),
});

export const taskPatch = z.object({
  title: z.string().trim().min(1).max(140).optional(),
  notes: z.string().trim().max(500).optional(),
  date: dateString.optional(),
  dayNumber: z.coerce.number().int().min(1).max(365).optional(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
  estimatedMinutes: z.coerce.number().int().min(5).max(480).optional(),
  timeSpentSeconds: z.coerce.number().int().min(0).optional(),
  completed: z.boolean().optional(),
});
