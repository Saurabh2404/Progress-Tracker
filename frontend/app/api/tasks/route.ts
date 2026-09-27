import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/server/db";
import { apiError, validationError } from "@/lib/server/http";
import { Sprint } from "@/lib/server/models/Sprint";
import { Task } from "@/lib/server/models/Task";
import { taskInput } from "@/lib/server/validation";

export async function GET(request: Request) {
  try {
    await connectDatabase();
    const url = new URL(request.url);
    const query: Record<string, unknown> = {};
    const sprintId = url.searchParams.get("sprintId");
    const date = url.searchParams.get("date");
    if (sprintId) query.sprintId = sprintId;
    if (date) query.date = { $gte: new Date(`${date}T00:00:00`), $lte: new Date(`${date}T23:59:59.999`) };
    const tasks = await Task.find(query)
      .populate("sprintId", "name color")
      .sort({ date: 1, completed: 1, createdAt: 1 });
    return NextResponse.json(tasks);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await connectDatabase();
    const parsed = taskInput.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error.issues[0]?.message);
    if (!isValidObjectId(parsed.data.sprintId) || !(await Sprint.exists({ _id: parsed.data.sprintId }))) {
      return validationError("Choose a valid sprint");
    }
    const task = await Task.create(parsed.data);
    return NextResponse.json(await task.populate("sprintId", "name color"), { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
