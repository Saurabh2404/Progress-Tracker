import { NextResponse } from "next/server";
import { connectDatabase } from "@/lib/server/db";
import { apiError, validationError } from "@/lib/server/http";
import { PlanSettings } from "@/lib/server/models/PlanSettings";
import { planSettingsPatch } from "@/lib/server/validation";

const defaults = {
  ownerKey: "primary",
  planName: "Upgrading_Skills",
  startDate: new Date(2026, 8, 26, 12),
  completionDate: new Date(2026, 10, 16, 12),
};

async function getSettings() {
  return PlanSettings.findOneAndUpdate(
    { ownerKey: "primary" },
    { $setOnInsert: defaults },
    { new: true, upsert: true, runValidators: true },
  );
}

export async function GET() {
  try {
    await connectDatabase();
    return NextResponse.json(await getSettings());
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await connectDatabase();
    const parsed = planSettingsPatch.safeParse(await request.json());
    if (!parsed.success) return validationError(parsed.error.issues[0]?.message);

    const current = await getSettings();
    const completionDate = parsed.data.completionDate
      ? new Date(parsed.data.completionDate)
      : current.completionDate;
    if (completionDate < current.startDate) {
      return validationError("Completion date must be after the plan start date");
    }

    const breakUpdate =
      parsed.data.isOnBreak === undefined
        ? {}
        : { breakStartedAt: parsed.data.isOnBreak ? new Date() : null };
    const settings = await PlanSettings.findOneAndUpdate(
      { ownerKey: "primary" },
      { $set: { ...parsed.data, ...breakUpdate } },
      { new: true, runValidators: true },
    );
    return NextResponse.json(settings);
  } catch (error) {
    return apiError(error);
  }
}
