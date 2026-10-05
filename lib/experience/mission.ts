import { runExperience, type ExperienceInput, type ExperienceResult } from "./adapter";
import type { DemoAdapter } from "./types";
export type MissionResult = ExperienceResult & { comparison: { selected: ExperienceResult; reference: ExperienceResult } };
export const runMission: DemoAdapter<ExperienceInput, MissionResult> = async (input, signal, onEvent) => {
  const snapshot = { ...input }; const started = performance.now();
  const selected = await runExperience(snapshot, signal, onEvent);
  const reference = await runExperience({ ...snapshot, maxSteps: 12 }, signal, () => {});
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  return { ...selected, executionMs: performance.now() - started, result: { ...selected.result, comparison: { selected: selected.result, reference: reference.result } } };
};
