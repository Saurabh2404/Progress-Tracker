import { sprintSeeds, taskSeeds } from "./catalog";
import { Sprint } from "./models/Sprint";
import { Task } from "./models/Task";

export async function syncPlanCatalog() {
  await Sprint.bulkWrite(
    sprintSeeds.map((sprint) => ({
      updateOne: {
        filter: { name: sprint.name },
        update: { $set: sprint },
        upsert: true,
      },
    })),
  );

  const sprints = await Sprint.find({ name: { $in: sprintSeeds.map((sprint) => sprint.name) } });
  const sprintIds = new Map(sprints.map((sprint) => [sprint.name, sprint._id]));

  const operations = [];
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

    operations.push({
      updateOne: {
        filter: { sourceKey: task.sourceKey },
        update: {
          $set: metadata,
          $setOnInsert: {
            timeSpentSeconds: task.timeSpentSeconds ?? 0,
            completed: task.completed ?? false,
            completedAt: task.completed ? new Date() : null,
          },
        },
        upsert: true,
      },
    });
  }

  if (operations.length) await Task.bulkWrite(operations, { ordered: false });
}
