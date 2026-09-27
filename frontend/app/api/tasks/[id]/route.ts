import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/server/db";
import { apiError, validationError } from "@/lib/server/http";
import { Task } from "@/lib/server/models/Task";
import { taskPatch } from "@/lib/server/validation";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDatabase();
    const { id } = await context.params;
    if (!isValidObjectId(id)) return validationError("Invalid task id");
    const parsed = taskPatch.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error.issues[0]?.message);
    const update = {
      ...parsed.data,
      ...(parsed.data.completed !== undefined ? { completedAt: parsed.data.completed ? new Date() : null } : {}),
    };
    const task = await Task.findByIdAndUpdate(id, update, { new: true, runValidators: true }).populate(
      "sprintId",
      "name color",
    );
    if (!task) return NextResponse.json({ message: "Task not found" }, { status: 404 });
    return NextResponse.json(task);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDatabase();
    const { id } = await context.params;
    if (!isValidObjectId(id)) return validationError("Invalid task id");
    const task = await Task.findByIdAndDelete(id);
    if (!task) return NextResponse.json({ message: "Task not found" }, { status: 404 });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
