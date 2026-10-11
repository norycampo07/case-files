import canonicalCases from "./canonical-cases.json";

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface LibraryCase {
  readonly id: string;
  readonly title: string;
  readonly family: string;
  readonly difficulty: Difficulty;
  readonly brief: string;
  readonly coreClues: readonly string[];
  readonly optionalClues: readonly string[];
  readonly culprit: string;
  readonly reveal: string;
  readonly designNotes: string;
}

// Production content, not generation prompts. Add future cases to this JSON
// using the same fields; design notes stay server-side and are never clues.
const ids = new Set<string>();
const titles = new Set<string>();
export const caseLibrary: readonly LibraryCase[] = Object.freeze(canonicalCases.map(entry => {
  const difficulty = entry.difficulty;
  if (difficulty !== "Easy" && difficulty !== "Medium" && difficulty !== "Hard") {
    throw new Error(`Invalid difficulty in canonical case ${entry.id}`);
  }
  if (ids.has(entry.id) || titles.has(entry.title)) throw new Error(`Duplicate canonical case ${entry.id}`);
  if (!entry.id || !entry.title || !entry.family || !entry.brief || !entry.culprit || !entry.reveal
    || entry.coreClues.length !== 3 || entry.optionalClues.length !== 7
    || [...entry.coreClues, ...entry.optionalClues].some(clue => !clue.trim())) {
    throw new Error(`Incomplete canonical case ${entry.id}`);
  }
  ids.add(entry.id);
  titles.add(entry.title);
  return Object.freeze({
    ...entry, difficulty,
    coreClues: Object.freeze([...entry.coreClues]),
    optionalClues: Object.freeze([...entry.optionalClues]),
  });
}));
