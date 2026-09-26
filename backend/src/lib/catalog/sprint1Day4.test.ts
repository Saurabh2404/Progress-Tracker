import assert from "node:assert/strict";
import test from "node:test";
import { sprintOneDay4 } from "./sprint1Day4.js";

test("Sprint 1 Day 4 matches the screenshot", () => {
 assert.equal(sprintOneDay4.length, 10);
 assert.equal(sprintOneDay4.reduce((sum, task) => sum + task.estimatedMinutes, 0), 175);
 assert.ok(sprintOneDay4.every(task => task.dayNumber === 4));
});

