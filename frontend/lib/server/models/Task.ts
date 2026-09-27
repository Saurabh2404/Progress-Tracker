import { Schema, model, models } from "mongoose";

const taskSchema = new Schema(
  {
    sourceKey: { type: String, unique: true, sparse: true, index: true },
    order: { type: Number, min: 1, default: 1 },
    sprintId: { type: Schema.Types.ObjectId, ref: "Sprint", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    notes: { type: String, default: "", trim: true, maxlength: 500 },
    date: { type: Date, required: true, index: true },
    dayNumber: { type: Number, min: 1, default: 1, index: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
    estimatedMinutes: { type: Number, min: 1, max: 480, default: 45 },
    timeSpentSeconds: { type: Number, min: 0, default: 0 },
    completed: { type: Boolean, default: false, index: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const Task = models.Task || model("Task", taskSchema);
