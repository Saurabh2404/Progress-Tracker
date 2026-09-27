import { Schema, model, models } from "mongoose";

const planSettingsSchema = new Schema(
  {
    ownerKey: { type: String, unique: true, default: "primary" },
    planName: { type: String, trim: true, maxlength: 80, default: "Upgrading_Skills" },
    startDate: { type: Date, required: true },
    completionDate: { type: Date, required: true },
    isOnBreak: { type: Boolean, default: false },
    breakStartedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const PlanSettings = models.PlanSettings || model("PlanSettings", planSettingsSchema);
