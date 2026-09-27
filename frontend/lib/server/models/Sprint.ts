import { Schema, model, models } from "mongoose";

const sprintSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80, unique: true },
    goal: { type: String, required: true, trim: true, maxlength: 240 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    color: { type: String, default: "#2f6f65" },
    estimatedMinutes: { type: Number, min: 0, default: 0 },
    dayEstimates: { type: [Number], default: [] },
    timeSpentSeconds: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true },
);

export const Sprint = models.Sprint || model("Sprint", sprintSchema);
