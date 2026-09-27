import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/server/db";
import { apiError, validationError } from "@/lib/server/http";
import { Sprint } from "@/lib/server/models/Sprint";
import { Task } from "@/lib/server/models/Task";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await connectDatabase();
    const { id } = await context.params;
    if (!isValidObjectId(id)) return validationError("Invalid sprint id");
    const sprint = await Sprint.findByIdAndDelete(id);
    if (!sprint) return NextResponse.json({ message: "Sprint not found" }, { status: 404 });
    await Task.deleteMany({ sprintId: sprint._id });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
