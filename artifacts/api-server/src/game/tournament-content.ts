import { randomInt, randomUUID } from "node:crypto";
import { caseLibrary, type Difficulty } from "./case-library";

export const characters = [
  { name: "Bekz Sarap", title: "Project Manager", personality: "Knows every tracker, deadline, and status update. Keeps project materials organized. Often discusses unrelated gossip with Andy.", portrait: "/portraits/bekz.png" },
  { name: "Artsu MoYan", title: "Quality & Insights Specialist", personality: "Usually notices issues before everyone else. Focuses on readability, consistency, and quality improvements. Often unavailable when needed.", portrait: "/portraits/artsu.png" },
  { name: "Andy Iglesias", title: "Client Coordinator", personality: "Connected to meetings, clients, and conversations. Handles scheduling, attachments, and meeting materials. Often discusses gossip with Bekz.", portrait: "/portraits/andy.png" },
  { name: "Prince Boni", title: "AI Engineer", personality: "Automates things nobody asked to automate. Frequently blamed; sometimes actually responsible.", portrait: "/portraits/prince.png" },
  { name: "Derick O'noso", title: "Systems Specialist", personality: "Can explain almost any technical problem. Works with permissions and technical configurations. Always collecting outing contributions.", portrait: "/portraits/derick.png" },
  { name: "Peri Vasquez", title: "Project Coordinator", personality: "Knows where documents, approvals, and trackers move. Helps organize shared spaces and filters reality through anime logic.", portrait: "/portraits/peri.png" },
  { name: "Nori Ocampus", title: "Workflow Specialist", personality: "Knows how processes really work. Helpful and forgetful. Maintains workflow exceptions and remembers important things much too late.", portrait: "/portraits/nori.png" },
] as const;

export type { Difficulty } from "./case-library";
export const basePoints = (difficulty: Difficulty) => ({ Easy: 100, Medium: 150, Hard: 200 })[difficulty];
export function difficultySequence(count: number): Difficulty[] {
  switch (count) {
    case 1: return ["Easy"];
    case 3: return ["Easy", "Medium", "Hard"];
    case 5: return ["Easy", "Easy", "Medium", "Medium", "Hard"];
    case 7: return ["Easy", "Easy", "Easy", "Medium", "Medium", "Medium", "Hard"];
    case 10: return ["Easy", "Easy", "Easy", "Medium", "Medium", "Medium", "Medium", "Hard", "Hard", "Hard"];
    default: throw new Error("Unsupported tournament length");
  }
}

export interface TournamentCaseContent {
  family: string;
  id: string;
  title: string;
  brief: string;
  difficulty: Difficulty;
  characters: typeof characters;
  clues: string[];
  culprit: string;
  what: string;
  why: string;
  isCoffee: boolean;
}

export function selectTournamentCase(difficulty: Difficulty, usedTitles: Set<string>): TournamentCaseContent {
  const available = caseLibrary.filter(entry => entry.difficulty === difficulty && !usedTitles.has(entry.title));
  if (!available.length) throw new Error(`No unused ${difficulty} cases remain in the canonical case library`);
  const entry = available[randomInt(available.length)]!;
  if (!characters.some(character => character.name === entry.culprit)) {
    throw new Error(`Unknown culprit in canonical case ${entry.id}`);
  }
  usedTitles.add(entry.title);
  // Fit the verbatim reveal into the existing What/Why screen without adding prose.
  const firstBreak = entry.reveal.indexOf("\n");
  return {
    id: randomUUID(), title: entry.title, brief: entry.brief, difficulty: entry.difficulty, family: entry.family,
    characters, clues: [...entry.coreClues, ...entry.optionalClues], culprit: entry.culprit,
    what: firstBreak < 0 ? entry.reveal : entry.reveal.slice(0, firstBreak),
    why: firstBreak < 0 ? "" : entry.reveal.slice(firstBreak + 1),
    isCoffee: entry.family === "Coffee",
  };
}
