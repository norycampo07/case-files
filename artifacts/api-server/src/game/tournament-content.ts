import { randomInt, randomUUID } from "node:crypto";
import { caseFamilies } from "./case-library";

export const characters = [
  { name: "Bekz Sarap", title: "Project Manager", personality: "Knows every tracker, deadline, and status update.", portrait: "/portraits/bekz.png" },
  { name: "Artsu MoYan", title: "Quality & Insights Specialist", personality: "Usually notices issues before everyone else.", portrait: "/portraits/artsu.png" },
  { name: "Andy Iglesias", title: "Client Coordinator", personality: "Connected to meetings, clients, and conversations.", portrait: "/portraits/andy.png" },
  { name: "Prince Boni", title: "AI Engineer", personality: "Automates things nobody asked to automate.", portrait: "/portraits/prince.png" },
  { name: "Derick O'noso", title: "Systems Specialist", personality: "Can explain almost any technical problem.", portrait: "/portraits/derick.png" },
  { name: "Peri Vasquez", title: "Project Coordinator", personality: "Knows where documents, approvals, and trackers move.", portrait: "/portraits/peri.png" },
  { name: "Nori Ocampus", title: "Workflow Specialist", personality: "Knows how processes really work.", portrait: "/portraits/nori.png" },
] as const;

export type Difficulty = "Easy" | "Medium" | "Hard";
export const basePoints = (difficulty: Difficulty) => ({ Easy: 100, Medium: 150, Hard: 200 })[difficulty];
export function difficultySequence(count: number): Difficulty[] {
  switch (count) {
    case 1: return ["Easy"];
    case 3: return ["Easy", "Medium", "Hard"];
    case 5: return ["Easy", "Easy", "Medium", "Medium", "Hard"];
    case 7: return ["Easy", "Easy", "Easy", "Medium", "Medium", "Medium", "Hard"];
    case 10: return ["Easy", "Easy", "Easy", "Easy", "Medium", "Medium", "Medium", "Medium", "Hard", "Hard"];
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

export function generateTournamentCase(difficulty: Difficulty, usedTitles: Set<string>): TournamentCaseContent {
  const usedFamilies = caseFamilies.filter(f => f.stories.some(s => usedTitles.has(s[0])));
  const unused = caseFamilies.filter(f => !usedFamilies.includes(f));
  const families = unused.length ? unused : caseFamilies;
  const available = families.flatMap(f => f.stories.filter(s => !usedTitles.has(s[0])).map(story => ({ family: f, story })));
  if (!available.length) throw new Error("Tournament case library exhausted");
  const { family, story: [title, brief, what, trace] } = available[randomInt(available.length)]!;
  usedTitles.add(title);
  const culprit = characters[randomInt(characters.length)]!;
  const decoy = characters.filter(c => c.name !== culprit.name)[randomInt(characters.length - 1)]!;
  const two = `${culprit.name} and ${decoy.name} helped prepare this activity. Their tasks were different.`;
  const humor = family.humor[randomInt(family.humor.length)]!;
  const clues = [
    difficulty === "Hard" ? trace : `${trace} ${two}`,
    family.clues[0]!,
    difficulty === "Easy"
      ? `${family.clues[6]} The preparation note belongs to the ${culprit.title}; ${decoy.name}'s task was for a different activity.`
      : difficulty === "Medium"
      ? `${family.clues[2]} The preparation note mentions ${culprit.personality}`
      : `${family.clues[1]} ${two}`,
    `${family.clues[3]}\n\n${humor}`,
    `${family.clues[4]} ${culprit.name} recalls preparing it before the team noticed.`,
    `${family.clues[5]} ${decoy.name}'s nearby task may look relevant, but involved a different activity.`,
    `${trace} The responsible role was ${culprit.title}.`,
    `${family.clues[2]} ${decoy.name} confirms their task was unrelated.`,
    `${what} The preparation note describes the same outcome.`,
    `${family.clues[6]} The relevant handover belongs to the ${culprit.title}, rather than ${decoy.name}'s separate task.`,
  ];
  return {
    id: randomUUID(), title, brief: randomInt(4) === 0 ? `${brief}\n\n${humor}` : brief, difficulty, family: family.name,
    characters, clues, culprit: culprit.name, what,
    why: `${culprit.name} prepared this activity. ${trace} That explains the mix-up; ${decoy.name} was helping with a separate task. Everyone is fictional, and no misconduct is alleged.`,
    isCoffee: family.name === "Coffee & Pantry",
  };
}
