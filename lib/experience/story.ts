import type { Heading } from "@/design-system/demo/project-story";
import type { RelayAgent } from "./relay-state";

type NodeCopy = { name: string };

export interface MesaStory {
  name: string;
  oneLiner: string;
  chips: string[];
  analogy: { heading: Heading; paragraphs: string[]; dictionaryLabel: string; dictionary: { term: string; means: string }[] };
  why: { title: string; text: string };
  tryIt: { heading: Heading; lead: string; question: (steps: number) => string; yes: string; no: string; stepsLabel: string; note: string; simulate: string; cancel: string; reset: string; error: string; idle: string };
  compare: { heading: Heading; lead: string; mine: (steps: number) => string; reference: string; finished: string; sentence: (mine: number, reference: number) => string };
  fit: { heading: Heading; worthLabel: string; worth: string; notLabel: string; not: string };
  proves: { heading: Heading; text: string };
  engineers: { summary: string; points: string[]; repoLabel: string };
  scene: { title: string; caption: string; statusLabels: { success: string; danger: string; off: string; idle: string }; nodes: Record<RelayAgent, NodeCopy>; legsOf: (n: number) => string; budgetOf: (n: number) => string; stepsLeft: (n: number) => string; timeUp: string; finish: string; delivered: string; dropped: string; trackLabel: (finished: number, left: number) => string };
}

export const STORY: Record<"en" | "es", MesaStory> = {
  en: {
    name: "Mesa",
    oneLiner: "A team of agents that delivers a report or stops when the budget runs out.",
    chips: ["Agent orchestration", "2 min", "Live demo"],
    analogy: {
      heading: { before: "The", accent: "analogy" },
      paragraphs: [
        "A relay race against the clock: each runner hands the baton to the next, and if time runs out the race stops wherever it is, even with one lap to go.",
        "Mesa runs four agents the same way. One plans, one researches, one writes and one reviews. Every handoff spends part of a budget, and when the budget is gone the work stops and says where it stopped.",
      ],
      dictionaryLabel: "In the diagram below",
      dictionary: [
        { term: "the runners", means: "the agents (plan, research, write, review)" },
        { term: "the baton", means: "the work in progress" },
        { term: "the clock", means: "the budget of steps" },
        { term: "the finish line", means: "an approved report" },
      ],
    },
    why: { title: "Why I built it", text: "" },
    tryIt: {
      heading: { before: "Try", accent: "it" },
      lead: "A risk team asks the agents for a short report on identity risk controls. You decide how many steps they are allowed to spend.",
      question: (n) => `Before you run it, place a bet: with a budget of ${n} ${n === 1 ? "step" : "steps"}, does the report get delivered?`,
      yes: "Yes, it's delivered",
      no: "No, it stops",
      stepsLabel: "Steps the agents may spend",
      note: "Each runner is one agent. Green finished its leg, red with an × is where the clock ran out, and grey never got the baton. The clock loses one wedge for every step spent.",
      simulate: "Run it",
      cancel: "Cancel",
      reset: "Start over",
      error: "The agents could not run. Try another budget.",
      idle: "Place your bet and press Run it.",
    },
    compare: {
      heading: { before: "Your budget", accent: "or a generous one" },
      lead: "Same task, same agents. The only change is how many steps they may spend.",
      mine: (n) => `Your budget (${n} ${n === 1 ? "step" : "steps"})`,
      reference: "Generous budget (12 steps)",
      finished: "of 4 agents finished",
      sentence: (mine, ref) => {
        if (mine === ref) return mine === 4 ? "Both budgets got all four agents to the finish line." : `Both budgets stopped after ${mine} of 4 agents.`;
        if (mine > ref) return `This time the bigger budget did worse: ${ref} against your ${mine}.`;
        return `With your budget, ${mine} of 4 agents finished. With 12 steps, ${ref}.`;
      },
    },
    fit: {
      heading: { before: "Where it", accent: "fits" },
      worthLabel: "Worth it",
      worth: "When an automated process can keep going on its own, like research that keeps finding one more source. I picture an analyst who asks for a summary on Friday and finds the bill on Monday.",
      notLabel: "Not needed",
      not: "For a one-shot task with a fixed number of steps that always ends.",
    },
    proves: {
      heading: { before: "What it", accent: "proves" },
      text: "I put the limit in before it was needed. A process that stops and tells you where it stopped is more useful than one that keeps spending.",
    },
    engineers: {
      summary: "For engineers",
      points: [
        "A typed graph of four agents with recorded handoffs; every step spends from a budget of steps, modeled tokens, subqueries and wall-clock time.",
        "When any budget runs out the run terminates, keeps the trace and drops the partial plan and draft.",
        "The demo agents are deterministic and seeded by the task; the token budget is fixed at 10,000 here so the bet depends only on steps.",
        "Stack: Next.js 16, TypeScript, Python, Vitest, pytest.",
      ],
      repoLabel: "Source code",
    },
    scene: {
      title: "How far the baton got",
      caption: "Watch each agent hand the work to the next, and see where the budget stops the race.",
      statusLabels: { success: "finished", danger: "stopped: time ran out", off: "never got the baton", idle: "waiting" },
      nodes: {
        planner: { name: "Plan" },
        researcher: { name: "Research" },
        writer: { name: "Write" },
        reviewer: { name: "Review" },
      },
      legsOf: (n) => `${n} of 4 agents finished`,
      budgetOf: (n) => `Budget: ${n} ${n === 1 ? "step" : "steps"}`,
      stepsLeft: (n) => `${n} ${n === 1 ? "step" : "steps"} left on the clock`,
      timeUp: "Time ran out",
      finish: "finish",
      delivered: "The baton crossed the finish line: the report was approved.",
      dropped: "The baton fell before the finish line: no report was delivered.",
      trackLabel: (finished, left) => `Relay track: ${finished} of 4 agents finished their leg, ${left} ${left === 1 ? "step" : "steps"} left on the clock.`,
    },
  },
  es: {
    name: "Mesa",
    oneLiner: "Un equipo de agentes que entrega un informe o se detiene cuando se acaba el presupuesto.",
    chips: ["Orquestación de agentes", "2 min", "Demo en vivo"],
    analogy: {
      heading: { before: "La", accent: "analogía" },
      paragraphs: [
        "Una carrera de relevos con el tiempo contado: cada corredor entrega la estafeta al siguiente, y si se acaba el tiempo la carrera se detiene donde va, aunque falte la última vuelta.",
        "Mesa pone a trabajar a cuatro agentes igual. Uno planea, otro investiga, otro redacta y otro revisa. Cada relevo gasta parte de un presupuesto, y cuando se acaba el trabajo se detiene y dice dónde se quedó.",
      ],
      dictionaryLabel: "En el diagrama de abajo",
      dictionary: [
        { term: "los corredores", means: "los agentes (planea, investiga, redacta, revisa)" },
        { term: "la estafeta", means: "el trabajo a medias" },
        { term: "el tiempo contado", means: "el presupuesto de pasos" },
        { term: "la meta", means: "un informe aprobado" },
      ],
    },
    why: { title: "Por qué lo hice", text: "" },
    tryIt: {
      heading: { accent: "Pruébalo" },
      lead: "Un equipo de riesgo les pide a los agentes un informe corto sobre controles de riesgo de identidad. Tú decides cuántos pasos pueden gastar.",
      question: (n) => `Antes de correrlo, apuesta: con ${n} ${n === 1 ? "paso" : "pasos"} de presupuesto, ¿se entrega el informe?`,
      yes: "Sí, se entrega",
      no: "No, se detiene",
      stepsLabel: "Pasos que pueden gastar los agentes",
      note: "Cada corredor es un agente. Verde terminó su relevo, rojo con una × es donde se acabó el tiempo y gris nunca recibió la estafeta. El cronómetro pierde una rebanada por cada paso gastado.",
      simulate: "Correr",
      cancel: "Cancelar",
      reset: "Empezar de nuevo",
      error: "Los agentes no pudieron correr. Prueba otro presupuesto.",
      idle: "Haz tu apuesta y presiona Correr.",
    },
    compare: {
      heading: { before: "Tu presupuesto", accent: "o uno holgado" },
      lead: "La misma tarea y los mismos agentes. Solo cambia cuántos pasos pueden gastar.",
      mine: (n) => `Tu presupuesto (${n} ${n === 1 ? "paso" : "pasos"})`,
      reference: "Presupuesto holgado (12 pasos)",
      finished: "de 4 agentes terminaron",
      sentence: (mine, ref) => {
        if (mine === ref) return mine === 4 ? "Con los dos presupuestos los cuatro agentes llegaron a la meta." : `Los dos presupuestos se detuvieron después de ${mine} de 4 agentes.`;
        if (mine > ref) return `Esta vez el presupuesto mayor rindió menos: ${ref} contra tus ${mine}.`;
        return `Con tu presupuesto terminaron ${mine} de 4 agentes. Con 12 pasos, ${ref}.`;
      },
    },
    fit: {
      heading: { before: "¿Dónde", accent: "sirve?" },
      worthLabel: "Vale la pena",
      worth: "Cuando un proceso automático puede seguir solo, como una investigación que siempre encuentra una fuente más. Me imagino a un analista que pide un resumen el viernes y encuentra la cuenta el lunes.",
      notLabel: "No hace falta",
      not: "Para una tarea de una sola vez, con un número fijo de pasos, que siempre termina.",
    },
    proves: {
      heading: { before: "Lo que", accent: "demuestra" },
      text: "Puse el límite antes de que hiciera falta. Un proceso que se detiene y dice dónde se quedó es más útil que uno que sigue gastando.",
    },
    engineers: {
      summary: "Para ingenieros",
      points: [
        "Un grafo tipado de cuatro agentes con relevos registrados; cada paso gasta de un presupuesto de pasos, tokens simulados, subconsultas y tiempo.",
        "Cuando se acaba cualquier presupuesto la ejecución termina, conserva la traza y descarta el plan y el borrador a medias.",
        "Los agentes de la demo son deterministas y usan la tarea como semilla; aquí el presupuesto de tokens queda fijo en 10,000 para que la apuesta dependa solo de los pasos.",
        "Stack: Next.js 16, TypeScript, Python, Vitest, pytest.",
      ],
      repoLabel: "Código fuente",
    },
    scene: {
      title: "Hasta dónde llegó la estafeta",
      caption: "Mira cómo cada agente le pasa el trabajo al siguiente, y dónde el presupuesto detiene la carrera.",
      statusLabels: { success: "terminó", danger: "detenido: se acabó el tiempo", off: "nunca recibió la estafeta", idle: "esperando" },
      nodes: {
        planner: { name: "Planea" },
        researcher: { name: "Investiga" },
        writer: { name: "Redacta" },
        reviewer: { name: "Revisa" },
      },
      legsOf: (n) => `${n} de 4 agentes terminaron`,
      budgetOf: (n) => `Presupuesto: ${n} ${n === 1 ? "paso" : "pasos"}`,
      stepsLeft: (n) => n === 1 ? "Queda 1 paso en el cronómetro" : `Quedan ${n} pasos en el cronómetro`,
      timeUp: "Se acabó el tiempo",
      finish: "meta",
      delivered: "La estafeta cruzó la meta: el informe quedó aprobado.",
      dropped: "La estafeta cayó antes de la meta: no se entregó el informe.",
      trackLabel: (finished, left) => `Pista de relevos: ${finished} de 4 agentes terminaron su tramo, ${left === 1 ? "queda 1 paso" : `quedan ${left} pasos`} en el cronómetro.`,
    },
  },
};
