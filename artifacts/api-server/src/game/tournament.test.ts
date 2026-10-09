import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { characters, difficultySequence } from "./tournament-content";
import {
  createTournament, joinTournament, getTournament, getTournamentLobby,
  setTournamentSettings, startTournament, advanceTournamentScreen,
  requestTournamentClue, beginTournamentVote, castTournamentBallot,
  nextTournamentRound, resetTournament, connectTournamentPlayer,
} from "./tournament-rooms";

function setup(cases = 3, teams = 2) {
  const hostSession = randomUUID();
  const first = createTournament(`Host${randomUUID().slice(0, 6)}`, hostSession);
  const code = first.code;
  const players = [{ id: first.me.id, session: hostSession, team: 0 }];
  setTournamentSettings(code, first.me.id, hostSession, { teamCount: teams, casesPerTournament: cases, votingSeconds: 60 });
  for (let team = 0; team < teams; team++) {
    for (let n = team === 0 ? 1 : 0; n < 6; n++) {
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
  for (const leader of context.leaders) {
    for (let n = 0; n < 5; n++) advanceTournamentScreen(context.code, leader.id, leader.session);
  }
}
function castTeam(context: ReturnType<typeof setup>, team: number, suspect: string) {
  for (const p of context.players.filter(p => p.team === team)) castTournamentBallot(context.code, p.id, p.session, suspect);
}
test("difficulty schedules match all five tournament lengths", () => {
  assert.deepEqual(difficultySequence(1), ["Easy"]);
  assert.deepEqual(difficultySequence(3), ["Easy", "Medium", "Hard"]);
  assert.deepEqual(difficultySequence(5), ["Easy", "Easy", "Medium", "Medium", "Hard"]);
  assert.deepEqual(difficultySequence(7), ["Easy", "Easy", "Easy", "Medium", "Medium", "Medium", "Hard"]);
  assert.deepEqual(difficultySequence(10), ["Easy", "Easy", "Easy", "Easy", "Medium", "Medium", "Medium", "Medium", "Hard", "Hard"]);
});
test("team membership, capacities, host permissions and browser ownership are enforced", () => {
  const session = randomUUID();
  const room = createTournament("FictionalHost", session);
  assert.throws(() => startTournament(room.code, room.me.id, session), /6–10/);
  const otherSession = randomUUID();
  const other = joinTournament(room.code, "FriendlyAlias", 1, otherSession);
  assert.throws(() => getTournament(room.code, room.me.id, otherSession), /not a member/);
  assert.throws(() => startTournament(room.code, other.me.id, otherSession), /Only the host/);
  assert.throws(() => joinTournament(room.code, "FriendlyAlias", 0, randomUUID()), /already/);
  assert.throws(() => joinTournament(room.code, "UnknownTeam", 2, randomUUID()), /available team/);
  for (let i = 0; i < 9; i++) joinTournament(room.code, `Fill${i}`, 0, randomUUID());
  assert.throws(() => joinTournament(room.code, "Overflow", 0, randomUUID()), /10 players/);
  assert.equal(getTournamentLobby(room.code).teams[0]!.playerCount, 10);
  assert.throws(() => setTournamentSettings(room.code, room.me.id, session, { teamCount: 1, casesPerTournament: 3, votingSeconds: 60 }), /2–5/);
});
test("same shared case; staged clues and extra clue deductions; no early solution or score leak; full reset", () => {
  const c = setup(1);
  startTournament(c.code, c.host.id, c.host.session);
  assert.equal(c.read().case!.id, c.read(c.leaders[1]!).case!.id);
  assert.equal(c.read().teamState!.clues.length, 0);
  assert.equal(c.read().case!.characters.length, 7);
  assert.equal(c.read().reveal, null);
  assert.equal(JSON.stringify(c.read()).includes('"culprit"'), false);
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
  const last = teamView.teamState!.clues[9]!;
  const correct = characters.find(ch => last.includes(`belongs to the ${ch.title},`))!.name;
  beginTournamentVote(c.code, host.id, host.session);
  castTeam(c, 0, correct);
  assert.equal(c.read().status, "round");
  assert.equal(c.read().teams[0]!.score, 0);
  assert.equal(c.read().reveal, null);
  const second = c.leaders[1]!;
  beginTournamentVote(c.code, second.id, second.session);
  castTeam(c, 1, characters.find(ch => ch.name !== correct)!.name);
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
  for (const leader of c.leaders) beginTournamentVote(c.code, leader.id, leader.session);
  castTournamentBallot(c.code, c.host.id, c.host.session, characters[0].name);
  const deadline = c.read().teamState!.deadline!;
  const originalNow = Date.now;
  try {
    Date.now = () => deadline + 1;
    const after = c.read();
    assert.equal(after.status, "reveal");
    assert.equal(after.reveal!.results[0]!.suspect, characters[0].name);
    assert.equal(after.reveal!.results[1]!.suspect, null);
    assert.equal(after.reveal!.results[1]!.points, 0);
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
