import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { asyncRoute } from "../lib/asyncRoute.js";
import { publishUpdate } from "../lib/realtime.js";
import { taskInput, taskPatch } from "../lib/validation.js";
import { Sprint } from "../models/Sprint.js";
import { Task } from "../models/Task.js";

export const taskRouter = Router();

taskRouter.get(
  "/",
  asyncRoute(async (request, response) => {
    const query: Record<string, unknown> = {};
    if (typeof request.query.sprintId === "string") query.sprintId = request.query.sprintId;
    if (typeof request.query.date === "string") {
      const start = new Date(`${request.query.date}T00:00:00`);
      const end = new Date(`${request.query.date}T23:59:59.999`);
      query.date = { $gte: start, $lte: end };
    }
    const tasks = await Task.find(query)
      .populate("sprintId", "name color")
      .sort({ date: 1, completed: 1, createdAt: 1 });
    response.json(tasks);
  }),
);

taskRouter.post(
  "/",
  asyncRoute(async (request, response) => {
    const parsed = taskInput.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ message: parsed.error.issues[0]?.message });
    if (!isValidObjectId(parsed.data.sprintId) || !(await Sprint.exists({ _id: parsed.data.sprintId }))) {
      return response.status(400).json({ message: "Choose a valid sprint" });
    }
    const task = await Task.create(parsed.data);
    publishUpdate();
    response.status(201).json(await task.populate("sprintId", "name color"));
  }),
);

taskRouter.patch(
  "/:id",
  asyncRoute(async (request, response) => {
    if (!isValidObjectId(request.params.id)) return response.status(400).json({ message: "Invalid task id" });
    const parsed = taskPatch.safeParse(request.body);
    if (!parsed.success) return response.status(400).json({ message: parsed.error.issues[0]?.message });
    const update = {
      ...parsed.data,
      ...(parsed.data.completed !== undefined ? { completedAt: parsed.data.completed ? new Date() : null } : {}),
    };
    const task = await Task.findByIdAndUpdate(request.params.id, update, { new: true, runValidators: true }).populate(
      "sprintId",
      "name color",
    );
    if (!task) return response.status(404).json({ message: "Task not found" });
    publishUpdate();
    response.json(task);
  }),
);

taskRouter.delete(
  "/:id",
  asyncRoute(async (request, response) => {
    if (!isValidObjectId(request.params.id)) return response.status(400).json({ message: "Invalid task id" });
    const task = await Task.findByIdAndDelete(request.params.id);
    if (!task) return response.status(404).json({ message: "Task not found" });
    publishUpdate();
    response.status(204).end();
  }),
);
