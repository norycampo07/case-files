import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { characters, difficultySequence, selectTournamentCase, basePoints } from "./tournament-content";
import { caseLibrary } from "./case-library";
import {
  createTournament, joinTournament, getTournament, getTournamentLobby,
  setTournamentSettings, startTournament, advanceTournamentScreen,
  requestTournamentClue, beginTournamentVote, castTournamentBallot,
  nextTournamentRound, resetTournament, connectTournamentPlayer,
  manageTournamentTeam,
} from "./tournament-rooms";

function setup(cases = 3, teams = 2, sizes: number | number[] = 6) {
  const hostSession = randomUUID();
  const first = createTournament(`Host${randomUUID().slice(0, 6)}`, hostSession);
  const code = first.code;
  const players = [{ id: first.me.id, session: hostSession, team: 0 }];
  setTournamentSettings(code, first.me.id, hostSession, { teamCount: teams, casesPerTournament: cases, votingSeconds: 60 });
  for (let team = 0; team < teams; team++) {
    for (let n = team === 0 ? 1 : 0; n < (typeof sizes === "number" ? sizes : sizes[team]!); n++) {
      const session = randomUUID();
      const joined = joinTournament(code, `Alias${randomUUID().slice(0, 8)}`, team, session);
      players.push({ id: joined.me.id, session, team });
    }
  }
  const host = players[0]!;
  const read = (p = host) => getTournament(code, p.id, p.session);
  return { code, players, host, read, leaders: Array.from({ length: teams }, (_, id) => players.find(p => p.team === id)!) };
}
function toChoice(context: ReturnType<typeof setup>) {
  for (let n = 0; n < 5; n++) advanceTournamentScreen(context.code, context.host.id, context.host.session);
}
function revealResults(c: ReturnType<typeof setup>) {
  advanceTournamentScreen(c.code, c.host.id, c.host.session);
  advanceTournamentScreen(c.code, c.host.id, c.host.session);
}
function castTeam(context: ReturnType<typeof setup>, team: number, suspect: string) {
  for (const p of context.players.filter(p => p.team === team)) castTournamentBallot(context.code, p.id, p.session, suspect);
}
test("difficulty schedules match all five tournament lengths", () => {
  assert.deepEqual(difficultySequence(1), ["Easy"]);
  assert.deepEqual(difficultySequence(3), ["Easy", "Medium", "Hard"]);
  assert.deepEqual(difficultySequence(5), ["Easy", "Easy", "Medium", "Medium", "Hard"]);
  assert.deepEqual(difficultySequence(7), ["Easy", "Easy", "Easy", "Medium", "Medium", "Medium", "Hard"]);
  assert.deepEqual(difficultySequence(10), ["Easy", "Easy", "Easy", "Medium", "Medium", "Medium", "Medium", "Hard", "Hard", "Hard"]);
});
test("team membership, capacities, host permissions and browser ownership are enforced", () => {
  const session = randomUUID();
  const room = createTournament("FictionalHost", session);
  assert.throws(() => startTournament(room.code, room.me.id, session), /1-10/);
  const otherSession = randomUUID();
  const other = joinTournament(room.code, "FriendlyAlias", 1, otherSession);
  assert.throws(() => getTournament(room.code, room.me.id, otherSession), /not a member/);
  assert.throws(() => startTournament(room.code, other.me.id, otherSession), /Only the host/);
  assert.throws(() => joinTournament(room.code, "FriendlyAlias", 0, randomUUID()), /already/);
  assert.throws(() => joinTournament(room.code, "UnknownTeam", 2, randomUUID()), /available team/);
  for (let i = 0; i < 9; i++) joinTournament(room.code, `Fill${i}`, 0, randomUUID());
  assert.throws(() => joinTournament(room.code, "Overflow", 0, randomUUID()), /10 players/);
  assert.equal(getTournamentLobby(room.code).teams[0]!.playerCount, 10);
  assert.throws(() => setTournamentSettings(room.code, room.me.id, session, { teamCount: 1, casesPerTournament: 3, votingSeconds: 60 }), /cannot be removed/);
  assert.throws(() => setTournamentSettings(room.code, room.me.id, session, { teamCount: 0, casesPerTournament: 3, votingSeconds: 60 }), /1–5/);
});
test("every size from one to ten can start, including uneven teams and a solo tournament", () => {
  for (let size = 1; size <= 10; size++) {
    const c = setup(1, 1, size);
    assert.equal(startTournament(c.code, c.host.id, c.host.session).status, "round");
    assert.equal(c.read().teams[0]!.playerCount, size);
  }
  const mixed = setup(1, 4, [1, 3, 7, 10]);
  assert.equal(startTournament(mixed.code, mixed.host.id, mixed.host.session).status, "round");
  assert.deepEqual(mixed.read().teams.map(t => t.playerCount), [1, 3, 7, 10]);

  const solo = setup(1, 1, 1);
  startTournament(solo.code, solo.host.id, solo.host.session);
  toChoice(solo);
  beginTournamentVote(solo.code, solo.host.id, solo.host.session);
  const result = castTournamentBallot(solo.code, solo.host.id, solo.host.session, characters[0].name);
  assert.equal(result.status, "round");
  assert.equal(result.reveal, null);
  revealResults(solo);
  assert.equal(solo.read().reveal!.results.length, 1);
  advanceTournamentScreen(solo.code, solo.host.id, solo.host.session);
  assert.equal(solo.read().status, "finished");
});
test("same shared case; staged clues and extra clue deductions; no early solution or score leak; full reset", () => {
  const c = setup(1);
  startTournament(c.code, c.host.id, c.host.session);
  assert.equal(c.read().case!.id, c.read(c.leaders[1]!).case!.id);
  assert.equal(c.read().teamState!.clues.length, 0);
  assert.equal(c.read().case!.characters.length, 7);
  assert.equal(c.read().reveal, null);
  assert.equal(JSON.stringify(c.read()).includes('"culprit":'), false);
  assert.throws(() => joinTournament(c.code, "Latecomer", 1, randomUUID()), /already begun/);
  toChoice(c);
  const host = c.host;
  for (let i = 0; i < 7; i++) {
    requestTournamentClue(c.code, host.id, host.session);
    advanceTournamentScreen(c.code, host.id, host.session);
  }
  const teamView = c.read();
  assert.equal(teamView.teamState!.clues.length, 10);
  assert.equal(teamView.teamState!.value, 30);
  assert.equal(c.read(c.leaders[1]!).teamState!.clues.length, 3);
  assert.throws(() => requestTournamentClue(c.code, host.id, host.session), /No more/);
  const correct = caseLibrary.find(entry => entry.title === teamView.case!.title)!.culprit;
  beginTournamentVote(c.code, host.id, host.session);
  castTeam(c, 0, correct);
  assert.equal(c.read().status, "round");
  assert.equal(c.read().teams[0]!.score, 0);
  assert.equal(c.read().reveal, null);
  const second = c.leaders[1]!;
  castTeam(c, 1, characters.find(ch => ch.name !== correct)!.name);
  assert.equal(c.read().reveal, null);
  revealResults(c);
  advanceTournamentScreen(c.code, host.id, host.session);
  const finished = c.read();
  assert.equal(finished.status, "finished");
  assert.equal(finished.reveal!.culprit, correct);
  assert.equal(finished.teams[0]!.score, 30);
  assert.equal(finished.teams[1]!.score, 0);
  assert.deepEqual(finished.winners, ["Team Alpha"]);
  assert.equal(finished.awards.length, 5);
  const reset = resetTournament(c.code, host.id, host.session);
  assert.equal(reset.status, "lobby");
  assert.equal(reset.case, null);
  assert.equal(reset.teamState, null);
  assert.equal(reset.reveal, null);
  assert.equal(reset.teams.every(t => t.score === 0), true);
  assert.equal(reset.players.length, 12);
});
test("live ballots survive reload, cannot be duplicated, and tied leaders get a 30-second runoff", () => {
  const c = setup();
  startTournament(c.code, c.host.id, c.host.session);
  toChoice(c);
  beginTournamentVote(c.code, c.host.id, c.host.session);
  const team = c.players.filter(p => p.team === 0);
  castTournamentBallot(c.code, team[0]!.id, team[0]!.session, characters[0].name);
  const reloaded = c.read(team[0]!);
  assert.equal(reloaded.teamState!.hasVoted, true);
  assert.equal(reloaded.teamState!.tallies[0]!.percent, 100);
  assert.throws(() => castTournamentBallot(c.code, team[0]!.id, team[0]!.session, characters[1].name), /already voted/);
  for (let i = 1; i < team.length; i++) castTournamentBallot(c.code, team[i]!.id, team[i]!.session, characters[i < 3 ? 0 : 1].name);
  const runoff = c.read().teamState!;
  assert.equal(runoff.screen, "runoff");
  assert.deepEqual(runoff.runoffOptions.sort(), [characters[0].name, characters[1].name].sort());
  assert.ok(Math.abs(runoff.deadline! - Date.now() - 30_000) < 100);
  assert.equal(runoff.hasVoted, false);
  assert.throws(() => castTournamentBallot(c.code, team[0]!.id, team[0]!.session, characters[2].name), /available character/);
  castTeam(c, 0, characters[0].name);
  assert.equal(c.read().teamState!.screen, "waiting");
  assert.throws(() => nextTournamentRound(c.code, c.host.id, c.host.session), /every team/);
});
test("timer resolves only submitted votes; no votes does not block; reconnect preserves member and case", () => {
  const c = setup(3, 5);
  startTournament(c.code, c.host.id, c.host.session);
  toChoice(c);
  beginTournamentVote(c.code, c.host.id, c.host.session);
  castTournamentBallot(c.code, c.host.id, c.host.session, characters[0].name);
  const deadline = c.read().teamState!.deadline!;
  const originalNow = Date.now;
  try {
    Date.now = () => deadline + 1;
    const after = c.read();
    assert.equal(after.status, "round");
    assert.equal(after.reveal, null);
    revealResults(c);
    assert.equal(c.read().reveal!.results[0]!.suspect, characters[0].name);
    assert.equal(c.read().reveal!.results[1]!.suspect, null);
    assert.equal(c.read().reveal!.results[1]!.points, 0);
  } finally { Date.now = originalNow; }
  nextTournamentRound(c.code, c.host.id, c.host.session);
  const current = c.read();
  assert.equal(current.roundIndex, 1);
  assert.equal(current.difficulty, "Medium");
  const disconnect = connectTournamentPlayer(c.code, c.host.id, c.host.session, "test-socket");
  assert.equal(c.read().me.connected, true);
  assert.equal(c.read().case!.id, current.case!.id);
  disconnect();
  assert.equal(c.read().me.connected, false);
});
test("host synchronizes stages and ballots; teams buy private extras without advancing anyone else", () => {
  const c = setup(1, 2, 1), guest = c.leaders[1]!;
  startTournament(c.code, c.host.id, c.host.session);
  assert.throws(() => advanceTournamentScreen(c.code, guest.id, guest.session), /Only the host/);
  toChoice(c);
  assert.equal(c.read(guest).teamState!.screen, "choice");
  requestTournamentClue(c.code, guest.id, guest.session);
  assert.equal(c.read(guest).teamState!.clues.length, 4);
  assert.equal(c.read().teamState!.clues.length, 3);
  advanceTournamentScreen(c.code, guest.id, guest.session);
  beginTournamentVote(c.code, guest.id, guest.session);
  assert.equal(c.read(guest).teamState!.ready, true);
  assert.equal(c.read().teamState!.screen, "choice");
  assert.throws(() => requestTournamentClue(c.code, guest.id, guest.session), /No more/);
  beginTournamentVote(c.code, c.host.id, c.host.session);
  assert.equal(c.read().teamState!.deadline, c.read(guest).teamState!.deadline);
  castTeam(c, 0, characters[0].name); castTeam(c, 1, characters[1].name);
  assert.equal(c.read().reveal, null);
  assert.throws(() => advanceTournamentScreen(c.code, guest.id, guest.session), /Only the host/);
  advanceTournamentScreen(c.code, c.host.id, c.host.session);
  assert.equal(c.read(guest).revealStage, "culprit");
  assert.throws(() => advanceTournamentScreen(c.code, guest.id, guest.session), /Only the host/);
  advanceTournamentScreen(c.code, c.host.id, c.host.session);
  assert.equal(c.read(guest).revealStage, "results");
});
test("team names persist everywhere, empty team removal remaps members, management is host/lobby-only", () => {
  const c = setup(1, 1, 1);
  manageTournamentTeam(c.code, c.host.id, c.host.session, { action: "rename", teamId: 0, name: " Coffee First " });
  assert.equal(getTournamentLobby(c.code).teams[0]!.name, "Coffee First");
  manageTournamentTeam(c.code, c.host.id, c.host.session, { action: "add" });
  manageTournamentTeam(c.code, c.host.id, c.host.session, { action: "add" });
  const session = randomUUID(), guest = joinTournament(c.code, "Guest", 2, session);
  assert.throws(() => manageTournamentTeam(c.code, guest.me.id, session, { action: "rename", teamId: 2, name: "No" }), /Only the host/);
  manageTournamentTeam(c.code, c.host.id, c.host.session, { action: "remove", teamId: 1 });
  assert.equal(getTournament(c.code, guest.me.id, session).me.teamId, 1);
  assert.throws(() => manageTournamentTeam(c.code, c.host.id, c.host.session, { action: "remove", teamId: 1 }), /joined players/);
  assert.throws(() => manageTournamentTeam(c.code, c.host.id, c.host.session, { action: "rename", teamId: 1, name: "coffee first" }), /unique/);
  assert.throws(() => manageTournamentTeam(c.code, c.host.id, c.host.session, { action: "rename", teamId: 0, name: " " }), /1–30/);
  startTournament(c.code, c.host.id, c.host.session);
  assert.throws(() => manageTournamentTeam(c.code, c.host.id, c.host.session, { action: "add" }), /before starting/);
  for (let n = 0; n < 5; n++) advanceTournamentScreen(c.code, c.host.id, c.host.session);
  beginTournamentVote(c.code, c.host.id, c.host.session);
  castTournamentBallot(c.code, c.host.id, c.host.session, characters[0].name);
  castTournamentBallot(c.code, guest.me.id, session, characters[0].name);
  revealResults(c);
  assert.equal(c.read().reveal!.results[0]!.teamName, "Coffee First");
  advanceTournamentScreen(c.code, c.host.id, c.host.session);
  assert.ok(c.read().awards.some(a => a.teamNames.includes("Coffee First")));
  resetTournament(c.code, c.host.id, c.host.session);
  assert.equal(c.read().teams[0]!.name, "Coffee First");
});
test("difficulty score values and extra deductions are correct across a three-round tournament", () => {
  const c = setup(3, 1, 1);
  startTournament(c.code, c.host.id, c.host.session);
  let total = 0;
  for (const difficulty of ["Easy", "Medium", "Hard"] as const) {
    toChoice(c);
    for (let n = 0; n < 7; n++) {
      requestTournamentClue(c.code, c.host.id, c.host.session);
      advanceTournamentScreen(c.code, c.host.id, c.host.session);
    }
    assert.equal(c.read().teamState!.value, basePoints(difficulty) - 70);
    const culprit = caseLibrary.find(entry => entry.title === c.read().case!.title)!.culprit;
    beginTournamentVote(c.code, c.host.id, c.host.session);
    castTeam(c, 0, culprit);
    revealResults(c);
    total += basePoints(difficulty) - 70;
    assert.equal(c.read().teams[0]!.score, total);
    if (difficulty !== "Hard") nextTournamentRound(c.code, c.host.id, c.host.session);
  }
  assert.equal(total, 240);
});
test("ten-case tournaments select every canonical case once with fixed content and portraits", () => {
  const used = new Set<string>();
  for (const difficulty of difficultySequence(10)) {
    const story = selectTournamentCase(difficulty, used);
    const entry = caseLibrary.find(entry => entry.title === story.title)!;
    assert.equal(story.clues.length, 10);
    assert.equal(story.brief, entry.brief);
    assert.equal(story.family, entry.family);
    assert.equal(story.difficulty, entry.difficulty);
    assert.equal(story.culprit, entry.culprit);
    assert.deepEqual(story.clues, [...entry.coreClues, ...entry.optionalClues]);
    assert.equal(`${story.what}\n${story.why}`, entry.reveal);
    assert.equal(story.isCoffee, entry.family === "Coffee");
    assert.deepEqual(story.characters.map(c => c.portrait), characters.map(c => c.portrait));
  }
  assert.equal(used.size, 10);
  assert.throws(() => selectTournamentCase("Easy", used), /No unused Easy/);
});

test("canonical authored text remains identical to the imported source", () => {
  // Golden fingerprints cover every authored field, not formatting of the JSON file.
  // Add new cases freely; do not rewrite the ten user-approved production cases.
  const fingerprints = [
    "758f02821cde4ae3f26f1d8eda0b7a5b2db77d5208b482d833c2be41775d5164",
    "3591bf8e650ba3c8ae89016da4f003471e5b8f74196501e757e83a3c79e9463b",
    "131db8bdf1d4538bc12aa1197430a7c31729270de3d448ecd6e6f171080f7c6c",
    "39160703cab6239ff7e88000212334dd39b37873589413bad8c477e3deaeedb0",
    "0f4ed630916d89d55f8e128e43bde27c200bc0aa844af9c746eb12d03264c2e4",
    "ca1d997cec3ab843af687e0aafdd21113cb27e996581c37e14f073a786a3b579",
    "35a5c26c8bb8fee33ab4f405f75d9ce6576a12b91ae4a1d139bb185364e8f62f",
    "0731a1d3fb33f4e03d77544b442a973c01841ab55633ba638d9f23ffcd418db0",
    "626d994e44a1d74ee007a364b9a277d7ee15fbb2683f41d9a1914593fa18d255",
    "16a98aba31571e12218b6bdf71ce2637bc2d290df8523543c11c73b52c9a7872",
  ];
  fingerprints.forEach((expected, index) => {
    const entry = caseLibrary.find(entry => entry.id === `case-${String(index + 1).padStart(2, "0")}`)!;
    assert.ok(entry);
    const actual = createHash("sha256").update(JSON.stringify([
      entry.title, entry.family, entry.difficulty, entry.brief, entry.coreClues,
      entry.optionalClues, entry.culprit, entry.reveal, entry.designNotes,
    ])).digest("hex");
    assert.equal(actual, expected, `${entry.id} canonical text changed`);
    assert.ok(characters.some(character => character.name === entry.culprit));
    assert.equal(entry.coreClues.length, 3);
    assert.equal(entry.optionalClues.length, 7);
  });
});

test("all tournament lengths retain clue progression, scoring, reveals, awards and replay", () => {
  for (const length of [1, 3, 5, 7, 10]) {
    const c = setup(length, 1, 1);
    startTournament(c.code, c.host.id, c.host.session);
    const seen = new Set<string>();
    let expectedScore = 0;
    for (const [index, difficulty] of difficultySequence(length).entries()) {
      const current = c.read();
      const entry = caseLibrary.find(entry => entry.title === current.case!.title)!;
      assert.equal(seen.has(entry.id), false);
      seen.add(entry.id);
      assert.equal(current.case!.brief, entry.brief);
      assert.equal(current.case!.difficulty, difficulty);
      assert.equal(current.teamState!.clues.length, 0);
      assert.equal(current.reveal, null);
      for (let stage = 0; stage < 5; stage++) {
        advanceTournamentScreen(c.code, c.host.id, c.host.session);
        assert.deepEqual(c.read().teamState!.clues, entry.coreClues.slice(0, Math.min(Math.max(stage, 0), 3)));
      }
      for (let extra = 0; extra < 7; extra++) {
        requestTournamentClue(c.code, c.host.id, c.host.session);
        assert.deepEqual(c.read().teamState!.clues, [...entry.coreClues, ...entry.optionalClues.slice(0, extra + 1)]);
        assert.equal(c.read().teamState!.value, basePoints(difficulty) - 10 * (extra + 1));
        assert.equal(c.read().reveal, null);
        assert.equal(JSON.stringify(c.read()).includes('"designNotes"'), false);
        advanceTournamentScreen(c.code, c.host.id, c.host.session);
      }
      assert.throws(() => requestTournamentClue(c.code, c.host.id, c.host.session), /No more/);
      beginTournamentVote(c.code, c.host.id, c.host.session);
      castTeam(c, 0, entry.culprit);
      assert.equal(c.read().reveal, null);
      revealResults(c);
      expectedScore += basePoints(difficulty) - 70;
      const revealed = c.read().reveal!;
      assert.equal(revealed.culprit, entry.culprit);
      assert.equal(`${revealed.what}\n${revealed.why}`, entry.reveal);
      assert.equal(c.read().teams[0]!.score, expectedScore);
      if (index < length - 1) nextTournamentRound(c.code, c.host.id, c.host.session);
    }
    advanceTournamentScreen(c.code, c.host.id, c.host.session);
    assert.equal(c.read().status, "finished");
    assert.equal(c.read().awards.length, 5);
    assert.deepEqual(c.read().winners, ["Team Alpha"]);
    const reset = resetTournament(c.code, c.host.id, c.host.session);
    assert.equal(reset.status, "lobby");
    assert.equal(reset.case, null);
    assert.equal(reset.teams[0]!.score, 0);
    startTournament(c.code, c.host.id, c.host.session);
    assert.equal(c.read().case!.difficulty, "Easy");
  }
});

test("selected case copies cannot rewrite the library or change its fixed solution", () => {
  const selected = selectTournamentCase("Easy", new Set());
  const entry = caseLibrary.find(entry => entry.title === selected.title)!;
  selected.clues[0] = "Local mutation";
  const repeat = selectTournamentCase("Easy", new Set(caseLibrary.filter(other => other.title !== entry.title).map(other => other.title)));
  assert.equal(repeat.clues[0], entry.coreClues[0]);
  assert.equal(repeat.culprit, entry.culprit);
  assert.equal(repeat.brief, entry.brief);
  assert.equal(`${repeat.what}\n${repeat.why}`, entry.reveal);
  assert.notEqual(repeat.id, selected.id);
});
