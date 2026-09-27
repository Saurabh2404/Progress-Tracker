import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/server/db";
import { apiError } from "@/lib/server/http";

export async function GET() {
  try {
    await connectDatabase();
    return NextResponse.json({
      status: "ok",
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      storage: "mongodb",
    });
  } catch (error) {
    return apiError(error);
  }
}
