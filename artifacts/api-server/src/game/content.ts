import { randomInt, randomUUID } from "node:crypto";
import type { CaseDetails, Evidence, InvestigationAction, PlayerRole, TimelineEntry } from "@workspace/api-zod";

export const roles: PlayerRole[] = ["Forensics Expert", "Interviewer", "Archivist", "Analyst", "Profiler"];
export const motives = ["Money", "Promotion", "Revenge", "Jealousy", "Cover-Up", "Personal Gain"];
export const methods = ["Duplicate Key", "Stolen Access Card", "Hidden Passage", "Log Manipulation", "Security Blind Spot", "Fake Alibi"];
export const actions: InvestigationAction[] = ["interview-suspect", "review-emails", "examine-crime-scene", "review-security-logs", "check-timeline", "verify-alibi", "search-office", "analyze-evidence"];
export const roleDescriptions: Record<PlayerRole, string> = {
  "Forensics Expert": "Examine the crime scene to receive one additional private forensic clue.",
  Interviewer: "Ask one free follow-up suspect question during the investigation.",
  Archivist: "You receive a private historical background clue.",
  Analyst: "You receive a private timeline hint.",
  Profiler: "You receive a private motive hint.",
};
const pick = <T>(items: T[]): T => items[randomInt(items.length)]!;
const shuffle = <T>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
};
const settings = [
  { location: "Museum", place: "the restoration wing", item: "the Meridian artifact" },
  { location: "Corporate Office", place: "the executive archive", item: "a confidential acquisition dossier" },
  { location: "University", place: "the faculty records suite", item: "a sealed research manuscript" },
  { location: "Hotel", place: "the private guest lounge", item: "a guest's antique watch" },
  { location: "Art Gallery", place: "the collection vault", item: "the original Harbor painting" },
  { location: "Library", place: "the rare-books room", item: "a first-edition atlas" },
  { location: "Research Lab", place: "the restricted testing suite", item: "the prototype's calibration file" },
];
const crimeNames = ["Missing Item", "Theft", "Sabotage", "Data Leak", "Disappearance", "Locked Room Mystery"];
const names = ["Morgan Hale", "Alex Rivera", "Jamie Ellis", "Cameron Brooks", "Taylor Quinn", "Jordan Park", "Robin Blake"];
const jobs = ["Manager", "Intern", "Security Guard", "Curator", "Accountant", "Researcher", "Executive Assistant"];
const motiveDetails: Record<string, string> = {
  Money: "an urgent debt and a promised cash payment",
  Promotion: "a plan to discredit a rival before the promotion decision",
  Revenge: "resentment over a public humiliation last month",
  Jealousy: "envy of a colleague's recognition and success",
  "Cover-Up": "a need to hide an earlier falsified expense report",
  "Personal Gain": "a plan to use the incident to secure a private consulting contract",
};
const methodDetails: Record<string, string> = {
  "Duplicate Key": "a secretly copied brass key",
  "Stolen Access Card": "another employee's borrowed access card, taken without permission",
  "Hidden Passage": "the unmarked service passage behind the shelving",
  "Log Manipulation": "altered access records that concealed the entry",
  "Security Blind Spot": "the gap between two cameras' fields of view",
  "Fake Alibi": "a prearranged witness statement that falsely placed the culprit elsewhere",
};
const methodTrace: Record<string, string> = {
  "Duplicate Key": "Fresh brass shavings match a key-copying machine. The lock was opened without force.",
  "Stolen Access Card": "The reader accepted a card belonging to someone who was away. Its owner reported it missing before the incident.",
  "Hidden Passage": "Dust was disturbed along an unmarked service passage. It connects the room to the rear corridor.",
  "Log Manipulation": "The original backup disagrees with the live entry log. An access event was deleted after the incident.",
  "Security Blind Spot": "The room can be reached through a precise gap between camera views. No footage covers that route.",
  "Fake Alibi": "A witness admits agreeing in advance to claim the culprit was at a meeting. The meeting never happened.",
};
export interface GeneratedCase {
  details: CaseDetails;
  solution: { suspect: string; motive: string; method: string; summary: string };
  clues: Record<InvestigationAction, Evidence>;
  timeline: TimelineEntry[];
  roleBriefs: Record<PlayerRole, string>;
  forensicClue: string;
  interviewClue: string;
}
export function generateCase(): GeneratedCase {
  const setting = pick(settings);
  const crime = pick(crimeNames);
  const shuffledNames = shuffle(names);
  const suspects = jobs.map((title, index) => ({
    name: shuffledNames[index]!, title,
    profile: pick(["Precise and reserved; knows the building well.", "Friendly under normal circumstances, but tense today.", "Long-serving staff member with access to internal routines.", "Ambitious and well-connected within the organization."]),
    alibi: pick(["Claims to have been in a planning meeting.", "Says they were completing paperwork in the staff room.", "Claims they were taking a break in the courtyard.", "Says they were on a phone call in the east corridor."]),
  }));
  const culprit = pick(suspects);
  const innocent = pick(suspects.filter(s => s !== culprit));
  const motive = pick(motives);
  const method = pick(methods);
  const incident = ({
    "Missing Item": `${setting.item} has vanished from ${setting.place}.`,
    Theft: `${setting.item} was stolen from ${setting.place}.`,
    Sabotage: `Critical equipment in ${setting.place} was deliberately disabled.`,
    "Data Leak": `Confidential records from ${setting.place} have been sent outside the organization.`,
    Disappearance: `A visiting consultant disappeared after entering ${setting.place}; the team suspects a staged departure.`,
    "Locked Room Mystery": `${setting.item} was removed from ${setting.place}, although the room appeared locked and undisturbed.`,
  })[crime]!;
  const details: CaseDetails = {
    title: `${setting.location}: ${crime}`,
    location: setting.location, crime, suspects,
    openingBrief: `At 18:40, an alarm brought staff to ${setting.place}. ${incident} Seven people had access during the critical window, 18:10–18:35. Establish who was responsible, why they acted, and how they concealed their involvement. Not every suspicious detail belongs to this case.`,
  };
  const clue = (action: InvestigationAction, heading: string, text: string): Evidence => ({ id: randomUUID(), action, heading, text, foundAt: "", privateTo: null });
  const clues: GeneratedCase["clues"] = {
    "interview-suspect": clue("interview-suspect", "A witness remembers", `A staff member saw ${culprit.name} leaving ${setting.place} at 18:32. ${culprit.name} insists the witness is mistaken, but gives no verifiable explanation.`),
    "review-emails": clue("review-emails", "An unfinished message", `A recovered draft from ${culprit.name}'s account describes ${motiveDetails[motive]}. It ends: “Tonight is the only opportunity. Nobody can know.”`),
    "examine-crime-scene": clue("examine-crime-scene", "The route inside", methodTrace[method]!),
    "review-security-logs": clue("review-security-logs", "A contradiction in the record", `An independent corridor sensor places ${culprit.name}'s issued device beside ${setting.place} at 18:28, contradicting their claimed alibi.`),
    "check-timeline": clue("check-timeline", "The critical eight minutes", `Between 18:24 and 18:32, ${culprit.name} cannot be accounted for. The other staff were independently observed outside ${setting.place} during that window.`),
    "verify-alibi": clue("verify-alibi", "One story does not hold", `${innocent.name}'s alibi is confirmed by two independent witnesses. ${culprit.name}'s claimed location has no independent confirmation; a receipt places them in the restricted corridor.`),
    "search-office": clue("search-office", "A suspicious old document", `A locked drawer in ${innocent.name}'s office contains an angry letter and an old floor plan. The letter concerns a dispute from three years ago. Neither document refers to tonight's incident.`),
    "analyze-evidence": clue("analyze-evidence", "A trace connects the facts", `A fresh fingerprint from the entry route matches ${culprit.name}. The accompanying trace is consistent with ${method.toLowerCase()}, not a forced break-in.`),
  };
  return {
    details, clues,
    solution: { suspect: culprit.name, motive, method, summary: `${culprit.name}, the ${culprit.title.toLowerCase()}, was responsible. The motive was ${motive.toLowerCase()}: ${motiveDetails[motive]}. They relied on ${methodDetails[method]} to carry out the incident. The fresh entry trace, contradictory alibi, and recovered correspondence establish the connection. The old document in ${innocent.name}'s office was unrelated.` },
    timeline: [
      { time: "18:10", event: "Staff begin the evening closing routine." },
      { time: "18:24", event: "Last confirmed check: the restricted area is undisturbed." },
      { time: "18:35", event: "The critical access window ends." },
      { time: "18:40", event: "The incident is discovered; the building is secured." },
    ],
    roleBriefs: {
      "Forensics Expert": "Your equipment is ready. Once the team examines the crime scene, you will receive an additional trace report visible only to you.",
      Interviewer: "You can ask one free follow-up question. It does not consume a team investigation action.",
      Archivist: `Historical records show that ${culprit.name} knew the restricted area's routines. A prior dispute involving ${innocent.name} was settled three years ago and is not a current lead.`,
      Analyst: `Your preliminary reconstruction identifies 18:24–18:32 as the decisive window. ${culprit.name}'s whereabouts in that window deserve attention.`,
      Profiler: `The likely motive involves ${motiveDetails[motive]}. Look for correspondence that confirms the personal stake.`,
    },
    forensicClue: `Fresh fibres on the entry route match the cuff of ${culprit.name}'s jacket. Their age places them within tonight's critical window.`,
    interviewClue: `The witness confirms ${culprit.name} said, “This will resolve everything,” just before the incident. A second witness connects that remark to ${motiveDetails[motive]}.`,
  };
}
