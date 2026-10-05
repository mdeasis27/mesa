"use client";
import { useState } from "react";
import { useLocale } from "@/design-system/i18n/context";
import { useDemoRun } from "@/design-system/demo/use-demo-run";
import { TracePlayer } from "@/design-system/demo/trace-player";
import { MissionBrief, MissionPrompt, MissionComparison, DecisionNotes } from "@/design-system/demo/mission-lab";
import { ScenarioPicker } from "@/design-system/demo/decision-lab";
import { traceCopy } from "@/lib/experience/trace-copy";
import { runMission } from "@/lib/experience/mission";
import story from "@/docs/quality/business-story.json";
import type { ExperienceInput, ExperienceResult } from "@/lib/experience/adapter";
import { MesaScene } from "@/lib/experience/mesa-scene";
const defaultInput = (es: boolean): ExperienceInput => ({task:es?"Evaluar controles de riesgo de identidad":"Assess identity risk controls",maxSteps:12,maxTokens:10000,maxRejections:1});
export default function Page() {
  const locale=useLocale(); const es=locale==="es"; const s=story[locale];
  const defaults=defaultInput(es);
  const [input,setInput]=useState(defaults); const [scenario,setScenario]=useState("a"); const [prediction,setPrediction]=useState<string|null>(null);
  const demo=useDemoRun(runMission); const run=demo.run;
  const change=(next:ExperienceInput,id="")=>{setInput(next);setScenario(id);setPrediction(null);demo.reset();};
  const choose=(id:string)=>change({...defaults,maxSteps:id==="a"?12:1,maxTokens:id==="a"?10000:100},id);
  const challenge=()=>change({...defaults,maxSteps:1});
  const outcome=(r:ExperienceResult)=>r.budget.exhausted?"stops":r.reviewerPassed&&r.draft?"completes":"review";
  const label=(r:ExperienceResult)=>outcome(r)==="completes"?(es?"Informe aprobado":"Report approved"):outcome(r)==="stops"?(es?"Límite alcanzado":"Budget stops work"):(es?"Requiere revisión":"Needs review");
  const detail=(r:ExperienceResult)=>`${r.budget.stepsUsed} ${es?"pasos":"steps"} · ${r.budget.tokensUsed} ${es?"unidades de tokens simuladas":"modeled token units"} · ${r.draft?(es?"borrador disponible":"draft available"):(es?"sin borrador final":"no final draft")}`;
  return <main className="min-h-screen bg-background px-5 py-12 text-foreground sm:px-6"><div className="mx-auto max-w-5xl">
    <MissionBrief locale={locale} name="Mesa" title={es?"¿Cuánto trabajo autorizas al agente?":"How much work do you authorize the agent to do?"} context={s.problem} role={s.user} stakes={s.value}/>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]"><section className="min-w-0 rounded-xl border border-border p-5">
      <button data-mission-challenge className="mb-5 min-h-11 rounded border border-accent px-4 text-sm" onClick={challenge}>{es?"Reto: solo un paso":"Challenge: only one step"}</button>
      <ScenarioPicker locale={locale} selected={scenario} onSelect={choose} options={[{id:"a",label:s.scenarioA.title,description:s.scenarioA.input},{id:"b",label:s.scenarioB.title,description:s.scenarioB.input}]}/>
      <label className="block text-sm">{es?"Tarea":"Task"}<textarea className="mt-2 min-h-28 w-full rounded border bg-background p-3" value={input.task} onChange={e=>change({...input,task:e.target.value})}/></label>
      <label className="mt-4 block text-sm">{es?"Pasos autorizados":"Authorized steps"}: {input.maxSteps}<input className="mt-2 w-full" type="range" min="1" max="12" value={input.maxSteps} onChange={e=>change({...input,maxSteps:Number(e.target.value)})}/></label>
      <label className="mt-4 block text-sm">{es?"Unidades de tokens simuladas":"Modeled token units"}: {input.maxTokens}<input className="mt-2 w-full" type="range" min="100" max="10000" step="100" value={input.maxTokens} onChange={e=>change({...input,maxTokens:Number(e.target.value)})}/></label>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">{es?"Una revisión permitida. La referencia mantiene tarea y tokens; solo autoriza 12 pasos. El reto de un paso mantiene 10 000 unidades para aislar ese límite.":"One revision allowance. The reference keeps task and tokens fixed; it authorizes 12 steps. The one-step challenge keeps 10,000 units to isolate that limit."}</p>
      <MissionPrompt locale={locale} question={es?"¿El flujo entregará un informe aprobado?":"Will the workflow deliver an approved report?"} options={[{id:"completes",label:es?"Informe aprobado":"Approved report"},{id:"stops",label:es?"Se detiene por límite":"Budget stops it"},{id:"review",label:es?"Requiere revisión":"Needs review"}]} prediction={prediction} onPredict={setPrediction} locked={demo.running||!!run}/>
      <div className="flex flex-wrap gap-2"><button data-run-experiment disabled={demo.running} className="min-h-11 flex-1 rounded bg-accent px-4 text-white disabled:opacity-50" onClick={()=>demo.execute(input)}>{es?"Ejecutar":"Run"}</button><button className="rounded border px-3" onClick={demo.cancel}>{es?"Cancelar":"Cancel"}</button><button className="rounded border px-3" onClick={()=>change(defaults,"a")}>{es?"Reiniciar":"Reset"}</button></div>
      {demo.error&&<p role="alert" className="mt-3 text-danger">{es?"No se pudo ejecutar el flujo.":"The workflow could not run."}</p>}
    </section><section className="min-w-0">{run?<TracePlayer collapsible locale={locale} trace={run.trace} executionMs={run.executionMs} translate={key=>traceCopy(locale,key)} renderStage={frame=><><MesaScene frame={frame} input={run.input} result={run.result} locale={locale}/>{frame.complete&&<MissionComparison locale={locale} sides={[{label:es?`Tu límite: ${run.input.maxSteps} pasos`:`Selected: ${run.input.maxSteps} steps`,value:label(run.result.comparison.selected),detail:detail(run.result.comparison.selected)},{label:es?"Referencia: 12 pasos":"Reference: 12 steps",value:label(run.result.comparison.reference),detail:detail(run.result.comparison.reference)}]} explanation={es?"Solo cambia el máximo de pasos; tokens y revisiones pueden detener ambas opciones. El motor revisa el presupuesto antes de cada paso: un paso puede superar el límite de tokens antes de la siguiente comprobación. Las unidades y latencias son simuladas, no facturación ni rendimiento reales.":"Only the step cap changes; tokens and review limits can stop both choices. The engine checks budget before each step: a step can exceed the token cap before the next check. Units and latency are simulated, not actual billing or performance."} prediction={prediction} actual={outcome(run.result)} actualLabel={label(run.result)}/>}</>}/>:<p className="rounded-xl border border-border p-5 text-sm text-muted-foreground">{es?"Elige un presupuesto para inspeccionar las transferencias.":"Choose a budget to inspect the handoffs."}</p>}</section></div>
    <DecisionNotes locale={locale} implementation={es?"Grafo local de planificación, investigación, redacción y revisión con límites explícitos.":"Local planning, research, writing and review graph with explicit limits."} rationale={es?"Mostrar trabajo y causa de terminación permite comparar límites. Un borrador no significa aprobación y más pasos no garantizan completar.":"Work and termination reasons make caps comparable. A draft is not approval, and more steps do not guarantee completion."} production={es?"Reservar recursos antes de llamadas reales, medir uso real, controlar herramientas, persistir trazas y revisar calidad humana.":"Reserve resources before real calls, meter actual usage, constrain tools, persist traces and review quality with people."}/>
  </div></main>;
}
