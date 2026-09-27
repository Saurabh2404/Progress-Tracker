import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/server/db";
import { apiError, validationError } from "@/lib/server/http";
import { Sprint } from "@/lib/server/models/Sprint";
import { Task } from "@/lib/server/models/Task";
import { sprintInput } from "@/lib/server/validation";

export async function GET() {
  try {
    await connectDatabase();
    const [sprints, stats] = await Promise.all([
      Sprint.find().sort({ startDate: 1 }).lean(),
      Task.aggregate([
        { $group: { _id: "$sprintId", total: { $sum: 1 }, completed: { $sum: { $cond: ["$completed", 1, 0] } } } },
      ]),
    ]);
    const bySprint = new Map(stats.map((item) => [String(item._id), item]));
    return NextResponse.json(
      sprints.map((sprint) => ({
        ...sprint,
        taskCount: bySprint.get(String(sprint._id))?.total ?? 0,
        completedCount: bySprint.get(String(sprint._id))?.completed ?? 0,
      })),
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await connectDatabase();
    const parsed = sprintInput.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error.issues[0]?.message);
    const sprint = await Sprint.create(parsed.data);
    return NextResponse.json({ ...sprint.toObject(), taskCount: 0, completedCount: 0 }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
