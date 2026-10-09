import { randomInt, randomUUID } from "node:crypto";
import type { CaseDetails, Evidence, InvestigationAction, PlayerRole, TimelineEntry } from "@workspace/api-zod";
import { caseTemplates, locations, methodDetails, motiveDetails, rumorPool, suspects } from "./workplace-data";

export const roles: PlayerRole[] = ["Forensics Expert", "Interviewer", "Archivist", "Analyst", "Profiler"];
export const motives = Object.keys(motiveDetails);
export const methods = Object.keys(methodDetails);
export const actions: InvestigationAction[] = ["interview-suspect", "review-emails", "examine-crime-scene", "review-security-logs", "check-timeline", "verify-alibi", "search-office", "analyze-evidence", "review-project-tracker", "audit-recent-changes"];
export const roleDescriptions: Record<PlayerRole, string> = {
  "Forensics Expert": "You receive one extra private evidence clue.",
  Interviewer: "Ask one free follow-up suspect question during the investigation.",
  Archivist: "You receive a private historical background clue.",
  Analyst: "You receive a private timeline hint.",
  Profiler: "You receive a private motive hint.",
};
const pick = <T>(items: readonly T[]): T => items[randomInt(items.length)]!;
const shuffle = <T>(items: readonly T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
};
export interface GeneratedCase {
  details: CaseDetails;
  solution: { suspect: string; motive: string; method: string; summary: string };
  clues: Record<InvestigationAction, Evidence>;
  timeline: TimelineEntry[];
  roleBriefs: Record<PlayerRole, string>;
  forensicClue: string;
  interviewClue: string;
  explanations: string[];
}
export function generateCase(): GeneratedCase {
  const template = pick(caseTemplates);
  const location = pick(locations);
  const roster = shuffle(suspects).map(s => ({ ...s }));
  const responsible = pick(roster);
  const unrelated = pick(roster.filter(s => s !== responsible));
  const motive = pick(motives);
  const method = pick(methods);
  const trace = methodDetails[method]!;
  const clue = (action: InvestigationAction, heading: string, text: string): Evidence => ({
    id: randomUUID(), action, heading, text, foundAt: "", privateTo: null,
  });
  const historyDetail = pick(["A naming convention changed last quarter.", "The team moved practice files to a separate folder last month.", "A previous template used a different default view."]);
  const clues: GeneratedCase["clues"] = {
    "interview-suspect": clue("interview-suspect", "A routine handover", `A colleague remembers ${responsible.name} preparing the ${template.item} in ${location} at 14:12. This was a normal, authorized task, not wrongdoing.`),
    "review-emails": clue("review-emails", "A practice-copy message", `${responsible.name}'s fictional meeting notes include: “My aim is to ${motiveDetails[motive]}.” The message refers to this ${template.item}.`),
    "examine-crime-scene": clue("examine-crime-scene", "The workspace view", `${trace.trace} The change is reversible and no real company data is involved.`),
    "review-security-logs": clue("review-security-logs", "An ordinary access record", `The fictional access record shows ${responsible.name}'s approved workspace session at 14:12. It records routine access, not a policy violation.`),
    "check-timeline": clue("check-timeline", "Edit time versus upload time", `The local edit took place at 14:12; synchronization completed at 14:18. ${responsible.name}'s routine task overlaps the earlier time. The later timestamp is a timeline inconsistency, not another person's action.`),
    "verify-alibi": clue("verify-alibi", "A calendar cross-check", `${unrelated.name}'s routine task is confirmed at 14:12 in a different workspace. ${responsible.name}'s stated task was also genuine, but included an authorized file handover at that time.`),
    "search-office": clue("search-office", "The very old checklist", `A checklist on ${unrelated.name}'s desk mentions a similar file name. It is from last year's practice session and belongs to a different project. A sticky note simply reads “Water the plant.”`),
    "analyze-evidence": clue("analyze-evidence", "A revision connects the facts", `The ${template.item}'s revision initials match ${responsible.name}. The view behavior is consistent with ${method}. This explains a harmless workflow mix-up, not misconduct.`),
    "review-project-tracker": clue("review-project-tracker", "The handover assignment", `The project tracker assigns the ${template.item} handover to ${responsible.name} at 14:10. ${unrelated.name}'s similarly named task concerns a separate practice file.`),
    "audit-recent-changes": clue("audit-recent-changes", "A recoverable change", `${trace.trace} The standard recovery view confirms the original work is safe and the confusing display can be restored.`),
  };
  const explanations = [
    `The handover, access record, revision initials, and tracker assignment connect ${responsible.name} to this fictional file change.`,
    `The practice-copy message identifies the motive: ${motive}. It was a routine goal to ${motiveDetails[motive]}.`,
    `The workspace view and recent changes identify ${method}: ${trace.description}.`,
    `The 14:18 audit time is an upload timestamp. The actual 14:12 edit explains the apparently contradictory timeline.`,
    `${unrelated.name}'s old checklist and separate task are red herrings. Most office rumors describe harmless routines or unrelated details.`,
    "All six characters are fictional. Being the game's randomly selected suspect is not a claim of dishonesty, misconduct, or a real incident.",
  ];
  return {
    details: {
      title: template.title, location, crime: "Fictional workplace mix-up", suspects: roster,
      openingBrief: `At 14:20 in ${location}, the team spots a curious mix-up: ${template.incident} The original work is recoverable. Six fictional colleagues took part in normal, authorized tasks between 14:10 and 14:18. Work together to connect a suspect, motive, and method. Nobody is accused of real wrongdoing. The office plant is available for moral support, but not interviews.`,
      initialEvidence: [
        `The ${template.item} was last confirmed in the correct team view at 14:05.`,
        "A routine change at 14:12 was synchronized at 14:18. The original or recovery copy is still available.",
      ],
      rumors: [...shuffle(rumorPool).slice(0, randomInt(1,4)), `${responsible.name} mentioned a file handover around 14:12. This may help connect the tracker clue; it was an ordinary task.`],
    },
    clues, explanations,
    solution: {
      suspect: responsible.name, motive, method,
      summary: `${responsible.name}, the fictional ${responsible.title.toLowerCase()}, made a routine authorized change while trying to ${motiveDetails[motive]}. The unexpected result came from ${trace.description}. The handover, revision and tracker clues establish the connection, while the standard recovery view restores the file. This was a light fictional mix-up: no dishonesty, misconduct, or policy violation is implied.`,
    },
    timeline: [
      { time: "14:05", event: "The file is confirmed in the correct team view." },
      { time: "14:10", event: "Routine file handovers begin." },
      { time: "14:12", event: "A routine local change occurs." },
      { time: "14:18", event: "Synchronization updates the shared view." },
      { time: "14:20", event: "The team notices the mix-up and opens a fictional case." },
    ],
    roleBriefs: {
      "Forensics Expert": "Your additional revision clue is ready below. Share the useful details with your team.",
      Interviewer: "You can ask one free follow-up question. It does not consume a team investigation action.",
      Archivist: `${historyDetail} ${unrelated.name}'s old checklist refers to last year's practice file, not today's ${template.item}.`,
      Analyst: "Separate the 14:12 editing time from the 14:18 upload time. Review the tracker and calendar rather than relying on the displayed timestamp alone.",
      Profiler: `A helpful correspondence lead concerns a routine goal to ${motiveDetails[motive]}. Nothing here implies wrongdoing.`,
    },
    forensicClue: `The revision identifier on the ${template.item} belongs to ${responsible.name}'s approved task. Its local timestamp is 14:12, before synchronization.`,
    interviewClue: `${responsible.name} recalls: “I wanted to ${motiveDetails[motive]}.” The standard view check later revealed the harmless mix-up.`,
  };
}
