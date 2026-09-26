import assert from "node:assert/strict";
import test from "node:test";
import { sprintOneDay5 } from "./sprint1Day5.js";

test("Sprint 1 Day 5 matches the screenshot", () => {
 assert.equal(sprintOneDay5.length, 8);
 assert.equal(sprintOneDay5.reduce((sum, task) => sum + task.estimatedMinutes, 0), 178);
 assert.ok(sprintOneDay5.every(task => task.dayNumber === 5));
});

