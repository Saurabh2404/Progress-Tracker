import { sprintSeeds, taskSeeds } from "./catalog/index.js";
import { Sprint } from "../models/Sprint.js";
import { Task } from "../models/Task.js";

export async function syncPlanCatalog() {
  await Sprint.bulkWrite(
    sprintSeeds.map((sprint) => ({
      updateOne: {
        filter: { name: sprint.name },
        update: { $setOnInsert: sprint },
        upsert: true,
      },
    })),
  );

  const sprints = await Sprint.find({ name: { $in: sprintSeeds.map((sprint) => sprint.name) } });
  const sprintIds = new Map(sprints.map((sprint) => [sprint.name, sprint._id]));

  for (const task of taskSeeds) {
    const sprintId = sprintIds.get(task.sprintName);
    if (!sprintId) throw new Error(`Missing sprint for catalog task: ${task.sourceKey}`);

    const metadata = {
      sourceKey: task.sourceKey,
      sprintId,
      title: task.title,
      notes: task.notes,
      date: task.date,
      dayNumber: task.dayNumber,
      difficulty: task.difficulty,
      estimatedMinutes: task.estimatedMinutes,
    };

    await Task.updateOne(
      { sourceKey: { $exists: false }, sprintId, dayNumber: task.dayNumber, title: task.title },
      { $set: { sourceKey: task.sourceKey } },
    );

    const insertDefaults = {
      timeSpentSeconds: task.timeSpentSeconds ?? 0,
      completed: task.completed ?? false,
      completedAt: task.completed ? new Date() : null,
    };

    try {
      await Task.updateOne(
        { sourceKey: task.sourceKey },
        { $set: metadata, $setOnInsert: insertDefaults },
        { upsert: true },
      );
    } catch (error) {
      if (!(error instanceof Error && "code" in error && error.code === 11000)) throw error;
      await Task.updateOne({ sourceKey: task.sourceKey }, { $set: metadata });
    }
  }
}
