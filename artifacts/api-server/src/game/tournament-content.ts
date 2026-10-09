import { randomInt, randomUUID } from "node:crypto";

export const characters = [
  { name: "Bekz Sarap", title: "Project Manager", personality: "Knows every tracker, deadline, and status update.", portrait: "/portraits/bekz.png" },
  { name: "Artsu MoYan", title: "Quality & Insights Specialist", personality: "Usually notices issues before everyone else.", portrait: "/portraits/artsu.png" },
  { name: "Andy Iglesias", title: "Client Coordinator", personality: "Connected to many meetings, clients, and conversations.", portrait: "/portraits/andy.png" },
  { name: "Prince Boni", title: "AI Engineer", personality: "Automates things nobody asked to automate.", portrait: "/portraits/prince.png" },
  { name: "Derick O'noso", title: "Systems Specialist", personality: "Can explain almost any technical problem.", portrait: "/portraits/derick.png" },
  { name: "Peri Vasquez", title: "Project Coordinator", personality: "Knows where documents, approvals, and trackers move.", portrait: "/portraits/peri.png" },
  { name: "Nori Ocampus", title: "Workflow Specialist", personality: "Knows how processes really work.", portrait: "/portraits/nori.png" },
] as const;

const caseTypes = [
  { title: "The Missing Tracker", brief: "A project tracker disappeared 30 minutes before executive review.", what: "The tracker was accidentally archived during an ordinary project tidy-up.", item: "tracker" },
  { title: "The Wrong Attachment", brief: "A cheerful update email arrived with the wrong file attached.", what: "An older practice attachment was selected by mistake.", item: "attachment" },
  { title: "The Vanishing Dashboard", brief: "The team dashboard looks empty just before a check-in.", what: "The dashboard was moved into a restricted practice folder; the data is safe.", item: "dashboard" },
  { title: "The Mystery of Column F", brief: "Column F has disappeared from the spreadsheet view.", what: "A saved filter hid Column F; not a cell was lost.", item: "column" },
  { title: "The Disappearing Survey", brief: "The team survey seems to have gone missing.", what: "The survey link pointed to an archived draft instead of the live copy.", item: "survey" },
  { title: "The Locked SharePoint Folder", brief: "An important folder shows up in the wrong shared view.", what: "An approved practice-folder setting hid it from the usual view.", item: "folder" },
  { title: "The Missing Sign-Off", brief: "The sign-off is nowhere to be seen before a friendly review.", what: "The sign-off was added to a different version of the review copy.", item: "sign-off" },
  { title: "The Missing Project Plan", brief: "The project plan cannot be found under its familiar filename.", what: "A routine rename made the plan look missing.", item: "plan" },
  { title: "The Corrupted Data File", brief: "An exported file opens with columns in the wrong places.", what: "The wrong export format scrambled the display; the source data is fine.", item: "export" },
  { title: "The Phantom Spreadsheet Edit", brief: "An unfamiliar spreadsheet edit has everyone comparing notes.", what: "A practice revision was displayed instead of the current version.", item: "spreadsheet" },
  { title: "The Executive Presentation Mix-Up", brief: "A leadership presentation opens with rehearsal slides.", what: "The presentation shortcut pointed to the rehearsal copy.", item: "presentation" },
  { title: "The Deleted Report", brief: "A report is missing from the active list.", what: "The report was archived, not deleted, and its recovery copy is intact.", item: "report" },
  { title: "The Missing Coffee Mug", brief: "The break-room mug has mysteriously changed desks.", what: "The mug was moved for a harmless team photo.", item: "mug" },
  { title: "The Empty Pantry", brief: "The pantry looks empty just before the afternoon break.", what: "The snacks were moved to a different shelf for a routine restock.", item: "pantry" },
  { title: "The Wrong Slide Deck", brief: "The shared slide deck looks nothing like the team's latest draft.", what: "A shortcut opened the team's old practice slides.", item: "slides" },
] as const;

export type Difficulty = "Easy" | "Medium" | "Hard";
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
  const available = caseTypes.filter(c => !usedTitles.has(c.title));
  if (!available.length) throw new Error("Tournament case library exhausted");
  const template = available[randomInt(available.length)]!;
  usedTitles.add(template.title);
  const culprit = characters[randomInt(characters.length)]!;
  const decoy = characters.filter(c => c.name !== culprit.name)[randomInt(characters.length - 1)]!;
  const generic = `${culprit.title} and ${decoy.title} both worked near the ${template.item} that morning.`;
  const clues = [
    difficulty === "Easy"
      ? `${culprit.name} and ${decoy.name} were both seen near the ${template.item} before the mix-up.`
      : difficulty === "Medium" ? generic
      : `Two colleagues with routine access discussed the ${template.item} that morning.`,
    `The change involved a familiar view or handover, not a lost original. Several people knew the usual process.`,
    difficulty === "Easy"
      ? `The latest note links the ${template.item} change to a routine ${culprit.title.toLowerCase()} task; the other checklist belongs to an older copy.`
      : difficulty === "Medium"
      ? `The latest note mentions a responsibility associated with the ${culprit.title}, although an older checklist points elsewhere.`
      : `A routine note about the ${template.item} was made shortly before the team noticed the surprise; an older checklist may be a distraction.`,
    `${decoy.name} had an old checklist for the ${template.item}. It might belong to a different practice task.`,
    `${culprit.name} suggested a small improvement, while ${decoy.name} also knew the relevant workspace.`,
    `The available record shows approved access, but it does not identify which routine task caused the mix-up.`,
    `Someone remembered ${culprit.title} mentioning the ${template.item} before lunch. It could have been a normal handover.`,
    `A file with a similar name was also open in a second practice workspace.`,
    `The outcome matches a harmless change to the ${template.item}, not a deletion or an allegation.`,
    `The relevant handover belongs to the ${culprit.title}, rather than the task on ${decoy.name}'s checklist. That checklist was for an older copy.`,
  ];
  return {
    id: randomUUID(), title: template.title, brief: template.brief, difficulty,
    characters, clues, culprit: culprit.name, what: template.what,
    why: `${culprit.name} was carrying out an ordinary authorized ${culprit.title.toLowerCase()} task. The unexpected outcome was a playful mix-up, not misconduct. ${decoy.name}'s nearby task was unrelated.`,
    isCoffee: template.title === "The Missing Coffee Mug" || template.title === "The Empty Pantry",
  };
}
