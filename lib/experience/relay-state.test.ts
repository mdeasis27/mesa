import { expect, it } from "vitest";
import { delivered, relayFrame, relayState } from "./relay-state";
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

it("drops the baton where the clock ran out, even when the cut-off agent never reached the trace", async () => {
  // Budget 2: the researcher spends the second step and is cut off before its step is recorded.
  const two = relayFrame(await result(2), Infinity, 2);
  expect(two).toMatchObject({ baton: 1, dropped: true, timeUp: true, stepsLeft: 0, finished: 1 });
  expect(two.tones.researcher).toBe("danger");
  expect(two.ran).toEqual({ planner: true, researcher: false, writer: false, reviewer: false });
  const three = relayFrame(await result(3), Infinity, 3);
  expect(three).toMatchObject({ baton: 3, dropped: true, timeUp: true, stepsLeft: 0, finished: 3 });
  expect(three.tones.reviewer).toBe("danger");
});

it("carries the baton over the finish line and keeps the unspent steps on the clock", async () => {
  expect(relayFrame(await result(4), Infinity, 4)).toMatchObject({ baton: 4, dropped: false, timeUp: false, stepsLeft: 0, finished: 4 });
  expect(relayFrame(await result(12), Infinity, 12)).toMatchObject({ baton: 4, dropped: false, timeUp: false, stepsLeft: 8, finished: 4 });
});

it("spends one wedge per revealed handoff while the relay is still running", async () => {
  const mid = relayFrame(await result(12), 2, 12);
  expect(mid).toMatchObject({ baton: 2, dropped: false, timeUp: false, stepsLeft: 10, finished: 2 });
  expect(mid.ran).toEqual({ planner: true, researcher: true, writer: false, reviewer: false });
  expect(relayFrame(await result(3), 0, 3)).toMatchObject({ baton: 0, stepsLeft: 3, dropped: false, finished: 0 });
});
