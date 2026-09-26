import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { asyncRoute } from "../lib/asyncRoute.js";
import { publishUpdate } from "../lib/realtime.js";
import { sprintInput } from "../lib/validation.js";
import { Sprint } from "../models/Sprint.js";
import { Task } from "../models/Task.js";

export const sprintRouter = Router();

sprintRouter.get(
  "/",
  asyncRoute(async (_request, response) => {
    const sprints = await Sprint.find().sort({ startDate: 1 }).lean();
    const stats = await Task.aggregate([
      { $group: { _id: "$sprintId", total: { $sum: 1 }, completed: { $sum: { $cond: ["$completed", 1, 0] } } } },
    ]);
    const bySprint = new Map(stats.map((item) => [String(item._id), item]));
    response.json(
      sprints.map((sprint) => ({
        ...sprint,
        taskCount: bySprint.get(String(sprint._id))?.total ?? 0,
        completedCount: bySprint.get(String(sprint._id))?.completed ?? 0,
      })),
    );
  }),
);

sprintRouter.post(
  "/",
  asyncRoute(async (request, response) => {
    const parsed = sprintInput.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ message: parsed.error.issues[0]?.message });
    const sprint = await Sprint.create(parsed.data);
    publishUpdate();
    response.status(201).json({ ...sprint.toObject(), taskCount: 0, completedCount: 0 });
  }),
);

sprintRouter.delete(
  "/:id",
  asyncRoute(async (request, response) => {
    if (!isValidObjectId(request.params.id)) return response.status(400).json({ message: "Invalid sprint id" });
    const sprint = await Sprint.findByIdAndDelete(request.params.id);
    if (!sprint) return response.status(404).json({ message: "Sprint not found" });
    await Task.deleteMany({ sprintId: sprint._id });
    publishUpdate();
    response.status(204).end();
  }),
);
