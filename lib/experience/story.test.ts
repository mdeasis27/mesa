import { describe, expect, it } from "vitest";
import { STORY } from "./story";
import { lintStory, storyStrings as strings } from "@/design-system/demo/copy-lint";

describe("Mesa story copy", () => {
  it("has the same shape in English and Spanish", () => {
    const keys = (o: unknown): string[] => o && typeof o === "object" && !Array.isArray(o) ? Object.entries(o).filter(([k]) => k !== "before" && k !== "after").flatMap(([k, v]) => [k, ...keys(v).map(x => `${k}.${x}`)]) : [];
    expect(keys(STORY.es)).toEqual(keys(STORY.en));
  });

  it("has no empty strings except the owner-supplied why note", () => {
    for (const locale of ["en", "es"] as const) {
      const { why, ...rest } = STORY[locale];
      expect(why.title.trim()).not.toBe("");
      for (const s of strings(rest)) expect(s.trim(), `${locale}: empty string`).not.toBe("");
    }
  });

  it("avoids AI-sounding patterns and brand names", () => {
    for (const locale of ["en", "es"] as const) expect(lintStory(STORY[locale]), locale).toEqual([]);
  });

  it("states the comparison truthfully at a gap, both finishing, a tie short of the line and the reverse case", () => {
    expect(STORY.es.compare.sentence(3, 4)).toBe("Con tu presupuesto terminaron 3 de 4 agentes. Con 12 pasos, 4.");
    expect(STORY.es.compare.sentence(4, 4)).toContain("los cuatro agentes llegaron a la meta");
    expect(STORY.es.compare.sentence(1, 1)).toContain("se detuvieron después de 1 de 4");
    expect(STORY.es.compare.sentence(4, 3)).toContain("el presupuesto mayor rindió menos");
    expect(STORY.en.compare.sentence(3, 4)).toBe("With your budget, 3 of 4 agents finished. With 12 steps, 4.");
  });

  it("asks the bet about the chosen number of steps, singular included", () => {
    expect(STORY.es.tryIt.question(3)).toContain("con 3 pasos de presupuesto");
    expect(STORY.es.tryIt.question(1)).toContain("con 1 paso de presupuesto");
    expect(STORY.en.tryIt.question(1)).toContain("a budget of 1 step,");
  });
});
