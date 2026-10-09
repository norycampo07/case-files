import type { Suspect } from "@workspace/api-zod";

export const suspects: Suspect[] = [
  { name: "Bekz Paras", title: "Operations Lead", profile: "Knows every tracker, process, and deadline.", alibi: "Claims to have been preparing a leadership update.", suspiciousTrait: "Always seems to know about issues before anyone else." },
  { name: "Artsu Moyon", title: "Workflow Specialist", profile: "Long-tenured employee with unusual knowledge of historical projects.", alibi: "Claims to have been reviewing archived records.", suspiciousTrait: "Knows where forgotten files are hidden." },
  { name: "Andy Iglesias", title: "Client Coordinator", profile: "Trusted communicator who works across teams.", alibi: "Claims to have been attending a client call.", suspiciousTrait: "Has access to calendars and communications." },
  { name: "Prince Boni", title: "Data Analyst", profile: "Expert at spotting inconsistencies in data.", alibi: "Claims to have been validating submissions.", suspiciousTrait: "Usually notices issues before everyone else." },
  { name: "Derick Onosa", title: "Systems Specialist", profile: "Maintains systems and permissions.", alibi: "Claims to have been troubleshooting technical issues.", suspiciousTrait: "Can explain nearly every system change." },
  { name: "Peri Vasquez", title: "Project Coordinator", profile: "Works across multiple projects and teams.", alibi: "Claims to have been updating project trackers.", suspiciousTrait: "Always seems to know where files and approvals are moving." },
];
export const caseTemplates = [
  { title: "The Missing Tracker", incident: "The team tracker no longer appears in its usual folder.", item: "team tracker" },
  { title: "The Wrong Attachment", incident: "The presentation email contains last week's attachment rather than today's file.", item: "email attachment" },
  { title: "The Vanishing Dashboard", incident: "The dashboard shortcut opens an empty workspace.", item: "dashboard shortcut" },
  { title: "The Mystery of Column F", incident: "Column F has disappeared from the team's spreadsheet view.", item: "Column F view" },
  { title: "The Disappearing Survey", incident: "The engagement survey link leads to an archived draft.", item: "survey draft" },
  { title: "The Locked SharePoint Folder", incident: "The shared folder is available only in its old workspace view.", item: "SharePoint folder" },
  { title: "The Missing Sign-Off", incident: "The approval marker is absent from the latest review copy.", item: "sign-off record" },
  { title: "The Missing Project Plan", incident: "The project plan cannot be found under its familiar filename.", item: "project plan" },
  { title: "The Corrupted Data File", incident: "The exported data file shows scrambled columns because its format settings differ.", item: "data export" },
  { title: "The Phantom Spreadsheet Edit", incident: "The spreadsheet shows a puzzling edit that no one remembers making.", item: "spreadsheet revision" },
  { title: "The Executive Presentation Mix-Up", incident: "The leadership deck opens with slides from a practice session.", item: "presentation deck" },
  { title: "The Case of the Deleted Report", incident: "The report is missing from the active list, but a recoverable copy remains.", item: "report listing" },
];
export const locations = ["Project Office", "Training Room", "Conference Room", "Records Archive", "Data Center", "Executive Office", "Shared Workspace", "Library", "Innovation Lab", "Digital Records Vault"];
export const motiveDetails: Record<string, string> = {
  "Protect Reputation": "make the team's work look polished before a friendly review",
  "Meet Deadline": "finish the handover before the afternoon deadline",
  "Hide Mistake": "tidy a harmless formatting mistake before sharing a practice copy",
  "Gain Recognition": "have a helpful improvement noticed at the team showcase",
  "Secure Promotion": "prepare a neat practice example for a career-development conversation",
  "Win Budget": "show a clear, useful prototype in the planning workshop",
  "Impress Leadership": "present an especially polished demo",
  "Maintain Control": "keep the team's many document versions neatly organized",
  "Cover Up an Error": "quietly correct an accidental typo in a rehearsal file",
  "Personal Pride": "make the finished file match their preferred layout",
};
// These are game labels, not allegations: all traces describe ordinary,
// authorized workflow quirks and accidental outcomes in a fictional sandbox.
export const methodDetails: Record<string, { description: string; trace: string }> = {
  "Duplicate Access": { description: "two authorized workspace tabs pointing to different copies", trace: "The two approved workspace tabs open different versions of the same file." },
  "Shared Credentials": { description: "the approved shared demo account, which combined two practice workspaces", trace: "The authorized demo account shows the practice workspace rather than the team workspace. No personal password was used." },
  "Hidden Backup Copy": { description: "an automatic backup copy becoming the selected working file", trace: "An auto-backup suffix appears on the active file while the original remains intact." },
  "Incorrect Version Control": { description: "an older revision becoming the current version", trace: "Version history shows the current pointer returning to an earlier, recoverable revision." },
  "Security Blind Spot": { description: "an ordinary sync-status gap between approved systems", trace: "The approved systems synchronized at different times; the status panel briefly missed the update, without an access breach." },
  "Edited Permissions": { description: "an approved practice-folder visibility setting being applied to the shared view", trace: "An approved visibility setting selected the practice group; the original folder is intact." },
  "Misleading Audit Log": { description: "a delayed system timestamp making a routine change appear out of sequence", trace: "The audit display reports upload time rather than editing time. The unaltered local record explains the mismatch." },
  "Hidden Spreadsheet Tab": { description: "a filter hiding the working tab in the selected view", trace: "The view configuration contains a hidden tab; its rows and formulas are still present." },
  "Deleted Notification": { description: "a dismissed routine notification leaving the old shortcut in use", trace: "The routine update notification was dismissed, so the view continued using its old shortcut. The update itself is available." },
  "Misfiled Documentation": { description: "a document being placed in an adjacent project folder", trace: "The filename index points to the neighboring project folder; the file can be moved back." },
};
export const rumorPool = [
  "Bekz Paras was seen near the project room shortly before the file mix-up; a routine planning visit is also possible.",
  "Artsu Moyon recently accessed archived documentation for the weekly reference check.",
  "Andy Iglesias attended an unexpected meeting about the next team lunch.",
  "Prince Boni noticed an inconsistent chart color earlier that week; it concerns a different file.",
  "Derick Onosa requested approved temporary access to the practice workspace for a routine check.",
  "Peri Vasquez was the last known editor of an unrelated tracker template.",
  "Someone renamed a demo folder after the office plant. The plant has declined to comment.",
];
