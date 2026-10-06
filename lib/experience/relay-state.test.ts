import { expect, it } from "vitest";
import { delivered, relayState } from "./relay-state";
import { runMission } from "./mission";

const result = async (maxSteps: number) => (await runMission({ task: "Evaluar controles de riesgo de identidad", maxSteps, maxTokens: 10000, maxRejections: 1 }, new AbortController().signal, () => {})).result;

it("marks done, stopped and not-reached agents from a real run", async () => {
  const stopped = await result(3);
  expect(relayState(stopped, Infinity)).toEqual({ planner: "success", researcher: "success", writer: "success", reviewer: "danger" });
  const done = await result(4);
  expect(Object.values(relayState(done, Infinity))).toEqual(["success", "success", "success", "success"]);
});

it("shows agents not yet revealed as idle, and marks the stop only once every step is shown", async () => {
  const stopped = await result(3);
  expect(relayState(stopped, 1)).toEqual({ planner: "success", researcher: "idle", writer: "idle", reviewer: "idle" });
});

it("the story's default bet can go either way on the steps slider", async () => {
  expect(delivered(await result(3))).toBe(false);
  expect(delivered(await result(4))).toBe(true);
  expect(delivered((await result(3)).comparison.reference)).toBe(true);
});
