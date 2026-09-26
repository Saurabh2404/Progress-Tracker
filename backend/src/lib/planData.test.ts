import assert from "node:assert/strict";
import test from "node:test";
import { sprintOneDayTwo, sprintSeeds, taskSeeds } from "./catalog/index.js";
import "./catalog/sprint1Day3.test.js";
import "./catalog/sprint1Day4.test.js";
import "./catalog/sprint1Day5.test.js";
import "./catalog/sprint1Day6.test.js";
import "./catalog/sprint1Day7.test.js";

test("catalog contains the eight Planly sprints", () => {
  assert.equal(sprintSeeds.length, 8);
  assert.deepEqual(
    sprintSeeds.map((sprint) => sprint.name),
    ["Sprint 1", "Sprint 2", "Sprint 3", "Sprint 4", "Sprint 5", "Sprint 6", "Sprint 7", "Sprint 8"],
  );
});

test("Sprint 1 Day 1 matches the captured schedule", () => {
  const tasks = taskSeeds.filter((task) => task.sprintName === "Sprint 1" && task.dayNumber === 1);
  assert.equal(tasks.length, 14);
  assert.equal(
    tasks.reduce((total, task) => total + task.estimatedMinutes, 0),
    347,
  );
});

test("Sprint 1 Day 2 matches the captured schedule", () => {
  assert.equal(sprintOneDayTwo.length, 15);
  assert.equal(
    sprintOneDayTwo.reduce((total, task) => total + task.estimatedMinutes, 0),
    327,
  );
});

test("catalog task source keys are unique", () => {
  assert.equal(new Set(taskSeeds.map((task) => task.sourceKey)).size, taskSeeds.length);
});
