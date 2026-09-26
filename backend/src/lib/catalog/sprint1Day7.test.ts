import assert from "node:assert/strict";
import test from "node:test";
import { sprintOneDay7 } from "./sprint1Day7.js";

test("Sprint 1 Day 7 matches the screenshot", () => {
 assert.equal(sprintOneDay7.length, 5);
 assert.equal(sprintOneDay7.reduce((sum, task) => sum + task.estimatedMinutes, 0), 136);
 assert.ok(sprintOneDay7.every(task => task.dayNumber === 7));
});

