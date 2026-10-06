"use client";
import { useState } from "react";
import { useLocale } from "@/design-system/i18n/context";
import { TracePlayer } from "@/design-system/demo/trace-player";
import { MissionPrompt, MissionComparison } from "@/design-system/demo/mission-lab";
import { useDemoRun } from "@/design-system/demo/use-demo-run";
import { StoryHero, StorySection, AnalogyBlock, WhyIBuiltIt, FitGuide, ProvesBlock, EngineerNotes } from "@/design-system/demo/project-story";
import { traceCopy } from "@/lib/experience/trace-copy";
import { runMission } from "@/lib/experience/mission";
import { MesaStoryScene } from "@/lib/experience/story-scene";
import { COMPLETE_FRAME, delivered, relayState } from "@/lib/experience/relay-state";
import type { RunState } from "@/lib/mesa/types";
import { STORY } from "@/lib/experience/story";

const REPO = "https://github.com/mdeasis27/mesa";
const DEFAULT_STEPS = 3;
// ponytail: tokens fixed at 10,000 so the bet text names every control the answer depends on.
const MAX_TOKENS = 10000;
const finished = (r: RunState) => Object.values(relayState(r, Infinity)).filter(t => t === "success").length;

export default function Page() {
  const locale = useLocale();
  const t = STORY[locale];
  const [steps, setSteps] = useState(DEFAULT_STEPS);
  const [prediction, setPrediction] = useState<string | null>(null);
  const demo = useDemoRun(runMission);
  const run = demo.run;
  const result = run?.result;
  // Section 03 waits for the relay to finish; keyed to the trace so every new run resets it.
  const [playedTrace, setPlayedTrace] = useState<typeof demo.trace | null>(null);
  const played = demo.trace.length === 0 || playedTrace === demo.trace;
  const clear = () => { setPrediction(null); demo.reset(); };
  const reset = () => { setSteps(DEFAULT_STEPS); clear(); };
  const task = locale === "es" ? "Evaluar controles de riesgo de identidad" : "Assess identity risk controls";
  const scene = (frame: typeof COMPLETE_FRAME) => result && run ? <MesaStoryScene key={result.trace.runId} frame={frame} result={result} maxSteps={run.input.maxSteps} locale={locale} /> : null;

  return <main className="mx-auto max-w-5xl px-5 py-8 text-foreground sm:py-12">
    <StoryHero name={t.name} oneLiner={t.oneLiner} chips={t.chips} />

    <StorySection index={1} heading={t.analogy.heading}>
      <AnalogyBlock paragraphs={t.analogy.paragraphs} dictionaryLabel={t.analogy.dictionaryLabel} dictionary={t.analogy.dictionary} />
    </StorySection>

    <WhyIBuiltIt title={t.why.title} text={t.why.text} />

    <StorySection index={2} heading={t.tryIt.heading} lead={t.tryIt.lead}>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
        <section className="min-w-0 rounded-xl border border-border bg-surface p-5">
          <MissionPrompt locale={locale} question={t.tryIt.question(steps)} prediction={prediction} onPredict={setPrediction} locked={Boolean(run) || demo.running} options={[{ id: "yes", label: t.tryIt.yes }, { id: "no", label: t.tryIt.no }]} />
          <label className="mt-5 block text-sm">{t.tryIt.stepsLabel} <span className="font-mono">{steps}</span>
            <input aria-label={t.tryIt.stepsLabel} className="mt-2 w-full" type="range" min="1" max="12" step="1" value={steps} onChange={e => { setSteps(Number(e.target.value)); clear(); }} />
          </label>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">{t.tryIt.note}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button type="button" data-run-experiment disabled={demo.running} className="min-w-0 flex-1 rounded-lg bg-accent px-4 py-3 text-sm font-medium text-white disabled:opacity-60" onClick={() => demo.execute({ task, maxSteps: steps, maxTokens: MAX_TOKENS, maxRejections: 1 })}>{t.tryIt.simulate}</button>
            <button type="button" className="rounded-lg border border-border px-3 py-3 text-sm" onClick={demo.cancel}>{t.tryIt.cancel}</button>
            <button type="button" className="rounded-lg border border-border px-3 py-3 text-sm" onClick={reset}>{t.tryIt.reset}</button>
          </div>
          {demo.error ? <p role="alert" className="mt-3 text-sm text-danger">{t.tryIt.error}</p> : null}
        </section>
        <section className="min-w-0">
          {run && result
            ? (demo.trace.length === 0 ? scene(COMPLETE_FRAME) : <TracePlayer collapsible autoPlay headingLevel="h3" onComplete={() => setPlayedTrace(demo.trace)} translate={key => traceCopy(locale, key)} trace={demo.trace} locale={locale} executionMs={run.executionMs} renderStage={scene} />)
            : <p className="rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">{t.tryIt.idle}</p>}
        </section>
      </div>
    </StorySection>

    <StorySection index={3} heading={t.compare.heading} lead={t.compare.lead}>
      {run && result && played ? <MissionComparison locale={locale} prediction={prediction} actual={delivered(result) ? "yes" : "no"} actualLabel={t.scene.legsOf(finished(result))} explanation={t.compare.sentence(finished(result.comparison.selected), finished(result.comparison.reference))} sides={[
        { label: t.compare.mine(run.input.maxSteps), value: `${finished(result.comparison.selected)}`, detail: t.compare.finished },
        { label: t.compare.reference, value: `${finished(result.comparison.reference)}`, detail: t.compare.finished, positive: finished(result.comparison.reference) > finished(result.comparison.selected) },
      ]} /> : null}
    </StorySection>

    <StorySection index={4} heading={t.fit.heading}>
      <FitGuide worthLabel={t.fit.worthLabel} worth={t.fit.worth} notLabel={t.fit.notLabel} not={t.fit.not} />
    </StorySection>

    <StorySection index={5} heading={t.proves.heading}>
      <ProvesBlock text={t.proves.text} />
    </StorySection>

    <EngineerNotes summary={t.engineers.summary}>
      <ul className="list-disc space-y-2 pl-5">{t.engineers.points.map(p => <li key={p}>{p}</li>)}</ul>
      <a className="mt-4 inline-block text-accent underline underline-offset-4" href={REPO}>{t.engineers.repoLabel} →</a>
    </EngineerNotes>
  </main>;
}
