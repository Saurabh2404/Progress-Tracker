import assert from "node:assert/strict";
import test from "node:test";
import { sprintOneDay6 } from "./sprint1Day6.js";

test("Sprint 1 Day 6 matches the screenshot", () => {
 assert.equal(sprintOneDay6.length, 4);
 assert.equal(sprintOneDay6.reduce((sum, task) => sum + task.estimatedMinutes, 0), 172);
 assert.ok(sprintOneDay6.every(task => task.dayNumber === 6));
});

