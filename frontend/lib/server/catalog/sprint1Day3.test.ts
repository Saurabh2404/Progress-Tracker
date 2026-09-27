import assert from "node:assert/strict";
import test from "node:test";
import { sprintOneDay3 } from "./sprint1Day3.js";

test("Sprint 1 Day 3 matches the screenshot", () => {
  assert.equal(sprintOneDay3.length, 6);
  assert.equal(
    sprintOneDay3.reduce((sum, task) => sum + task.estimatedMinutes, 0),
    158,
  );
  assert.ok(sprintOneDay3.every((task) => task.dayNumber === 3));
});
