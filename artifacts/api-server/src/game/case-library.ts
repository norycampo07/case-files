// Authored, fictional workplace mix-ups. Families never share their evidence pool.
type Story = [title: string, brief: string, what: string, trace: string];
export interface CaseFamily { name: string; stories: Story[]; clues: string[]; humor: string[] }
export const caseFamilies: CaseFamily[] = [
  {
    name: "Trackers & Reports",
    stories: [
      ["The Missing Tracker", "The project tracker vanished thirty minutes before executive review.", "A saved owner filter hid every active project.", "The owner filter was set to last quarter's team."],
      ["The Vanishing Dashboard", "The dashboard shows zero projects, while the team insists it has been busy.", "The reporting date range was set to a future week.", "The date picker starts next Monday."],
      ["The Deleted Pivot Table", "The summary table has disappeared, but the source rows are still here.", "The pivot output was placed on a hidden summary sheet.", "A hidden sheet contains the complete pivot output."],
      ["The Mystery of Column F", "Column F is missing between E and G before a reporting check-in.", "A presentation view hid the column without deleting its formulas.", "The formulas still reference the hidden column."],
    ],
    clues: ["The source totals have not changed.", "A saved display setting differs from the shared reporting view.", "The chart legend still lists the supposedly missing category.", "The summary can be rebuilt from unchanged source rows.", "The change was made while preparing the reporting view.", "An older printout shows a different filter, not missing data.", "The reporting checklist identifies who prepared the final view."],
    humor: ["The formulas still reference Column F.\n\nThe workbook was clearly not informed\nof the change.", "A hidden-column indicator is visible.\n\nMagic or Excel?\nThe investigation continues.", "Filter settings were recently changed.\n\nSomeone may still be explaining\nthe difference between sorting and filtering.", "The workbook size did not decrease.\n\nColumn F may be missing,\nbut the workbook remains impressively large.", "Several innocent spreadsheets\nwere questioned."],
  },
  {
    name: "Questionnaires & Surveys",
    stories: [
      ["The Duplicate Submission", "One survey answer appears twice, and the respondent swears they clicked once.", "A test response was counted alongside the live submission.", "One answer is marked as a preview response."],
      ["The Missing Benefit Table", "A benefits questionnaire skips its entire comparison table.", "A branching condition sent eligible respondents past the benefit section.", "The benefits branch tests the wrong answer option."],
      ["The Corrupted Response File", "The survey export mixes answer labels and column headings.", "Question codes were exported instead of readable answer labels.", "The export uses internal question codes."],
      ["The Missing Worksheet", "The questionnaire summary is missing a worksheet everyone expected.", "The summary export excluded an optional question group.", "The omitted group is unchecked in the export selector."],
    ],
    clues: ["The questionnaire's preview and live links are different.", "The branching preview takes a different route from the expected answer.", "The response count includes one sample entry.", "A question group's inclusion setting was changed.", "The answer labels still exist in the questionnaire editor.", "The test invitation went to a different respondent list.", "The questionnaire testing checklist records who checked this route."],
    humor: ["Artsu MoYan reviewed the report.\n\nThe report now contains\nmore comments than data.", "Artsu MoYan noticed a discrepancy.\n\nThe discrepancy then became\na six-tab investigation."],
  },
  {
    name: "Presentations",
    stories: [
      ["The Wrong Slide Deck", "The executive deck opens with rehearsal slides instead of today's update.", "A presentation shortcut selected the rehearsal version.", "The opening slide carries the rehearsal date."],
      ["The Missing Speaker Notes", "The presenter opens the deck and finds no speaker notes.", "A notes-free sharing copy was selected for presentation.", "The selected version is labelled audience copy."],
      ["The Last-Minute Revision", "The closing slide now promises a milestone the team never discussed.", "An earlier draft's closing slide was pasted into the final version.", "The closing slide's revision date predates the agreed milestone."],
    ],
    clues: ["The version list contains both a rehearsal and an audience copy.", "The thumbnail preview differs from the approved slide order.", "Presenter view is displaying a notes-free version.", "The revision label is older than the approval comment.", "The export includes a slide from the rehearsal section.", "The approved version still has the correct closing slide.", "The deck handover names the person who assembled this version."],
    humor: ["Three versions of the file exist.\n\nAll are named FINAL.", "A reviewer located:\n\nFINAL_v8\nFINAL_v9\nFINAL_v9_REALFINAL\nFINAL_v9_REALFINAL2\n\nConfidence has decreased.", "Peri Vasquez located the missing file.\n\nNobody knows how it arrived there.\n\nIncluding Peri."],
  },
  {
    name: "Meetings & Calendars",
    stories: [
      ["The Meeting With No Attendees", "The host arrives on time. Nobody else appears.", "The invitation was saved as a draft instead of sent.", "The invitation has no sent timestamp."],
      ["The Missing Invite", "Half the team remembers a meeting they were never invited to.", "The invitation used an outdated attendee group.", "The attendee list contains last month's group."],
      ["The Double-Booked Meeting Room", "Two teams arrive at the same room for different meetings.", "One organizer booked a similarly named room at another location.", "The room resource lists the other building."],
    ],
    clues: ["The invitation preview and sent invitation have different attendee lists.", "The calendar entry has a draft marker.", "The room's location field does not match the meeting location.", "The recurrence applies only to the organizer's calendar.", "The reminder references a different time zone.", "The accepted room booking belongs to the other location.", "The scheduling checklist identifies who prepared this invitation."],
    humor: ["Andy Iglesias scheduled a meeting\nto discuss the meeting.\n\nProgress was reported."],
  },
  {
    name: "Coffee & Pantry",
    stories: [
      ["The Missing Coffee Mug", "The familiar mug disappears just as the afternoon coffee starts.", "The mug was carried to a harmless team-photo setup.", "A photo prop list includes the mug."],
      ["The Empty Pantry", "The pantry shelf looks empty before the afternoon break.", "The snacks were placed on the lower shelf during restocking.", "The restock card points to the lower shelf."],
      ["The Missing Creamer", "The coffee corner has everything except creamer.", "The creamer was packed into the meeting-room refreshment tray.", "The refreshment order includes the creamer carton."],
      ["The Coffee Voucher Incident", "The team coffee vouchers have already been marked used.", "A practice stamp was mistaken for the redemption stamp.", "The stamp says SAMPLE in small print."],
    ],
    clues: ["A break-room witness remembers the item being carried away.", "The refreshment list includes a second serving location.", "The restock card was written before the break.", "A similar mug belongs to someone else.", "The tray label describes a planned team activity.", "The receipt confirms the supplies arrived that morning.", "The pantry handover names who arranged the supplies."],
    humor: ["The mug disappeared after lunch.\n\nProductivity immediately declined.", "A similar mug was discovered.\n\nThe owner insists the mug has character."],
  },
  {
    name: "Office Life",
    stories: [
      ["The Missing Birthday Cake", "The birthday candles are ready, but the cake is nowhere in sight.", "The cake was kept in another fridge to preserve the surprise.", "A fridge shelf label says celebration, not lunch."],
      ["The Phantom Air Conditioner", "The room suddenly becomes chilly during a team huddle.", "A scheduled cooling preset started earlier than expected.", "The wall controller shows the morning preset."],
      ["The Mysterious Sticky Notes", "A wall of mysterious sticky notes appears overnight.", "A planning warm-up was left behind after the previous team session.", "The notes use the previous workshop's color key."],
      ["The Missing Whiteboard Marker", "Every marker is missing just before the brainstorming session.", "The marker set was packed into the portable workshop kit.", "The workshop packing list includes all six markers."],
    ],
    clues: ["The room setup checklist includes a planned team activity.", "A physical label points to a different storage spot.", "The previous workshop used the same color key.", "The supplies list records a temporary move.", "A colleague remembers preparing the room before the session.", "The room booking explains why the equipment was packed.", "The setup handover identifies the person who prepared the space."],
    humor: ["Bekz Sarap already knew about the issue.\n\nThe investigation is focused on\nhow Bekz always knows.", "Bekz Sarap noticed the problem early.\n\nNobody is sure whether this is preparation,\nexperience, or wizardry."],
  },
  {
    name: "Workflows",
    stories: [
      ["Approval Limbo", "The request has been awaiting approval longer than the project itself.", "The approval branch routed it back to its requester.", "The branch's next approver is the requester."],
      ["The Escalation Loop", "Every escalation returns to the same queue.", "Two routing rules send the request back to each other.", "The second routing rule points to the first queue."],
      ["The Missing Sign-Off", "The review is complete, but the sign-off remains blank.", "The sign-off step was attached to the draft review branch.", "The completed signature belongs to the draft branch."],
      ["The Workflow Detour", "A simple request visits seven queues before reaching the right one.", "An optional review branch became the default route.", "The optional review condition is always true."],
    ],
    clues: ["The routing diagram has a return arrow.", "The approver list includes the requester.", "The completed step belongs to the draft branch.", "The optional review condition has no exception.", "A queue transition explains the delay.", "The documented route and the active route differ.", "The process handover identifies who configured this branch."],
    humor: ["A workflow was bypassed.\n\nTo be fair, nobody understood the workflow.", "The approval chain contains seven steps.\n\nNobody can explain Step 5.", "Nori Ocampus noticed something unusual.\n\nUnfortunately, Nori was busy untangling\na workflow so complex that it developed\nits own workflow.", "The workflow did not fail.\n\nThe workflow completed successfully.\n\nUnfortunately, it completed the wrong workflow.", "A workflow diagram was located.\n\nThe workflow diagram references\nanother workflow diagram.", "The documentation exists.\n\nSeveral investigators are still trying\nto find where.", "The request followed the documented procedure.\n\nThis is notable because nobody remembers\nwhat the documented procedure is.", "Nori Ocampus noticed something unusual.\n\nThree hours later, Nori returned\nwith a workflow map,\na root-cause analysis,\ntwo recommendations,\nand three additional concerns.", "Nori Ocampus spotted a discrepancy.\n\nThe discrepancy then invited\nseveral other discrepancies."],
  },
  {
    name: "Systems & Technology",
    stories: [
      ["The Locked Folder", "A shared folder suddenly asks everyone to request access.", "A practice permission group was selected instead of the live team group.", "The permission group ends with Training."],
      ["The Phantom Notification", "A reminder arrives for a task that has already been completed.", "A duplicate reminder rule was left enabled.", "Two notification rules target the same task."],
      ["The Password Reset Incident", "Reset reminders arrive for accounts that do not need resets.", "A training reminder was sent to the live notification list.", "The reminder template is labelled training."],
      ["The Audit Log Gap", "A routine activity summary seems to skip an entire hour.", "The log viewer uses a different time-zone offset.", "The viewer's offset differs by one hour."],
    ],
    clues: ["The configuration preview differs from the live setting.", "The activity viewer uses a different time-zone offset.", "A training rule remains enabled.", "The notification target list contains a duplicate entry.", "The permission group belongs to a practice workspace.", "The original activity records are intact.", "The configuration handover identifies who prepared this setting."],
    humor: ["Derick O'noso explained what happened.\n\nThe incident was resolved.\n\nThe explanation remains unresolved.", "Systems are operating normally.\n\nOpinions differ on what \"normally\" means.", "Prince Boni suggested automating the task.\n\nInvestigators are still determining\nwhether this helps the case.", "Prince Boni mentioned the process\ncould be automated.\n\nThis statement is no longer considered evidence,\nas it applies to almost every process."],
  },
];
