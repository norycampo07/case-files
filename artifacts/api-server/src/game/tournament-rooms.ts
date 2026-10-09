import { randomInt, randomUUID } from "node:crypto";
import type { Server as SocketServer } from "socket.io";
import type { TournamentView, TournamentSettings } from "@workspace/api-zod";
import { characters, difficultySequence, generateTournamentCase, basePoints, type TournamentCaseContent } from "./tournament-content";

type Screen = "brief" | "roster" | "clue1" | "clue2" | "clue3" | "choice" | "extra" | "vote" | "runoff" | "waiting";
type Status = "lobby" | "round" | "reveal" | "finished";
interface Member { id: string; displayName: string; sessionId: string; teamId: number; connections: Set<string> }
interface TeamStats { score: number; correctCount: number; extraCluesUsed: number; princeBlames: number; coffeeSolves: number; boldMin: number }
interface TeamRound {
  ready: boolean;
  screen: Screen; extras: number; deadline: number | null;
  ballots: Map<string, string>; princeVoters: Set<string>;
  runoffOptions: string[]; choice: string | null; points: number;
  baseline: TeamStats;
}
interface TournamentRoom {
  teamNames: string[]; revealStage: "culprit" | "results" | "champions";
  code: string; hostId: string; status: Status; members: Member[];
  settings: TournamentSettings; roundIndex: number; usedTitles: Set<string>;
  case: TournamentCaseContent | null; teamRounds: Map<number, TeamRound>;
  scores: Map<number, TeamStats>; updatedAt: number;
}
export class TournamentError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const rooms = new Map<string, TournamentRoom>();
const names = ["Team Alpha", "Team Bravo", "Team Charlie", "Team Delta", "Team Echo"];
let io: SocketServer | undefined;
export function attachTournamentRealtime(server: SocketServer) { io = server; }
const initialStats = (): TeamStats => ({ score: 0, correctCount: 0, extraCluesUsed: 0, princeBlames: 0, coffeeSolves: 0, boldMin: Infinity });
function roomFor(code: string) {
  const room = rooms.get(code.toUpperCase());
  if (!room) throw new TournamentError(404, "That tournament room was not found.");
  room.updatedAt = Date.now();
  return room;
}
function memberFor(code: string, playerId: string, sessionId: string | undefined) {
  const room = roomFor(code);
  const member = room.members.find(p => p.id === playerId && p.sessionId === sessionId);
  if (!member) throw new TournamentError(403, "This browser is not a member of the tournament. Rejoin with your alias.");
  return { room, member };
}
function hostFor(code: string, playerId: string, sessionId: string | undefined) {
  const context = memberFor(code, playerId, sessionId);
  if (context.member.id !== context.room.hostId) throw new TournamentError(403, "Only the host can do that.");
  return context;
}
function availableTeams(room: TournamentRoom) {
  return Array.from({ length: room.settings.teamCount }, (_, id) => {
    const stats = room.scores.get(id) ?? initialStats();
    const baseline = room.teamRounds.get(id)?.baseline;
    const safeStats = room.status === "round" && baseline ? baseline : stats;
    return {
      ready: room.teamRounds.get(id)?.ready ?? false,
      ballotComplete: room.teamRounds.get(id)?.screen === "waiting",
      id, name: room.teamNames[id]!, playerCount: room.members.filter(p => p.teamId === id).length,
      score: safeStats.score, correctCount: safeStats.correctCount, extraCluesUsed: safeStats.extraCluesUsed,
      princeBlames: safeStats.princeBlames, coffeeSolves: safeStats.coffeeSolves,
    };
  });
}
export function getTournamentLobby(code: string) {
  const room = roomFor(code);
  return { code: room.code, status: room.status, teamCount: room.settings.teamCount, teams: availableTeams(room) };
}
function winners(room: TournamentRoom) {
  const teams = availableTeams(room);
  const highest = Math.max(...teams.map(t => t.score));
  return teams.filter(t => t.score === highest).map(t => t.name);
}
function awards(room: TournamentRoom): TournamentView["awards"] {
  const available = availableTeams(room);
  const contest = (name: string, score: (id: number) => number, eligible = (_id: number) => true, preferLowest = false) => {
    const teams = available.filter(t => eligible(t.id));
    if (!teams.length) return { name, teamNames: [], value: 0 };
    const value = (preferLowest ? Math.min : Math.max)(...teams.map(t => score(t.id)));
    return { name, teamNames: teams.filter(t => score(t.id) === value).map(t => t.name), value };
  };
  const stat = (id: number) => room.scores.get(id)!;
  return [
    contest("Best Detectives", id => stat(id).correctCount),
    contest("Clue Hoarders", id => stat(id).extraCluesUsed),
    contest("Bold Detectives", id => stat(id).boldMin, id => stat(id).correctCount > 0, true),
    contest("Prince Blamers", id => stat(id).princeBlames),
    contest("Coffee Investigators", id => stat(id).coffeeSolves, id => stat(id).coffeeSolves > 0),
  ];
}
function view(room: TournamentRoom, member: Member): TournamentView {
  const content = room.case;
  const state = room.teamRounds.get(member.teamId);
  const teammates = room.members.filter(p => p.teamId === member.teamId);
  const submitted = state?.ballots.size ?? 0;
  const candidates = state?.screen === "runoff" ? state.runoffOptions : characters.map(c => c.name);
  const unlocked = state?.screen === "brief" || state?.screen === "roster" ? 0 :
    state?.screen === "clue1" ? 1 : state?.screen === "clue2" ? 2 : state?.screen === "clue3" ? 3 : 3 + (state?.extras ?? 0);
  const reveal = room.status === "reveal" || room.status === "finished";
  return {
    code: room.code, status: room.status, hostId: room.hostId, revealStage: room.revealStage,
    me: { id: member.id, displayName: member.displayName, teamId: member.teamId, isHost: member.id === room.hostId, connected: member.connections.size > 0 },
    settings: { ...room.settings }, roundIndex: room.roundIndex,
    difficulty: content?.difficulty ?? null,
    teams: availableTeams(room),
    players: room.members.map(p => ({
      id: p.id, displayName: p.displayName, teamId: p.teamId,
      isHost: p.id === room.hostId, connected: p.connections.size > 0,
    })),
    case: content ? {
      id: content.id, title: content.title, brief: content.brief,
      characters: characters.map(c => ({ ...c })), clueCount: content.clues.length,
      difficulty: content.difficulty, family: content.family, basePoints: basePoints(content.difficulty),
    } : null,
    teamState: state ? {
      teamId: member.teamId, screen: state.screen, clues: content?.clues.slice(0, unlocked) ?? [],
      value: basePoints(content!.difficulty) - state.extras * 10, ready: state.ready,
      hasVoted: state.ballots.has(member.id), deadline: state.deadline,
      runoffOptions: [...state.runoffOptions], submittedVotes: submitted,
      tallies: candidates.map(suspect => {
        const count = [...state.ballots.values()].filter(v => v === suspect).length;
        return { suspect, count, percent: submitted ? Math.round(count * 100 / submitted) : 0 };
      }),
      choice: state.choice,
    } : null,
    reveal: reveal && content ? {
      culprit: content.culprit, what: content.what, why: content.why,
      results: Array.from({ length: room.settings.teamCount }, (_, id) => {
        const round = room.teamRounds.get(id)!;
        return {
          teamId: id, teamName: room.teamNames[id]!, suspect: round.choice,
          correct: round.choice === content.culprit, points: round.points,
          extraClues: round.extras,
        };
      }),
    } : null,
    winners: room.status === "finished" ? winners(room) : [],
    awards: room.status === "finished" ? awards(room) : [],
  };
}
function broadcast(room: TournamentRoom) {
  for (const member of room.members) for (const socketId of member.connections) io?.to(socketId).emit("room:update", view(room, member));
}
function membership(room: TournamentRoom, displayName: string, sessionId: string, teamId: number) {
  const name = displayName.trim();
  if (!name || name.length > 24) throw new TournamentError(400, "Enter a fictional alias up to 24 characters.");
  if (!Number.isInteger(teamId) || teamId < 0 || teamId >= room.settings.teamCount) throw new TournamentError(400, "Choose an available team.");
  if (room.members.some(p => p.displayName.toLowerCase() === name.toLowerCase())) throw new TournamentError(409, "That alias is already in this tournament.");
  if (room.members.filter(p => p.teamId === teamId).length >= 10) throw new TournamentError(409, "That team already has 10 players.");
  const member = { id: randomUUID(), displayName: name, sessionId, teamId, connections: new Set<string>() };
  room.members.push(member);
  return member;
}
export function createTournament(displayName: string, sessionId: string) {
  if (rooms.size >= 100) throw new TournamentError(503, "The tournament desk is full. Please retry later.");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code: string;
  do { code = Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join(""); } while (rooms.has(code));
  const room: TournamentRoom = {
    code, hostId: "", status: "lobby", members: [], teamNames: names.slice(0, 2), revealStage: "culprit",
    settings: { teamCount: 2, casesPerTournament: 3, votingSeconds: 60 },
    roundIndex: 0, usedTitles: new Set(), case: null, teamRounds: new Map(), scores: new Map(),
    updatedAt: Date.now(),
  };
  const member = membership(room, displayName, sessionId, 0);
  room.hostId = member.id;
  rooms.set(code, room);
  return view(room, member);
}
export function joinTournament(code: string, displayName: string, teamId: number, sessionId: string) {
  const room = roomFor(code);
  if (room.status !== "lobby") throw new TournamentError(409, "This tournament has already begun.");
  const member = membership(room, displayName, sessionId, teamId);
  broadcast(room);
  return view(room, member);
}
export function getTournament(code: string, playerId: string, sessionId: string | undefined) {
  const { room, member } = memberFor(code, playerId, sessionId);
  settleExpired(room);
  return view(room, member);
}
export function connectTournamentPlayer(code: string, playerId: string, sessionId: string | undefined, socketId: string) {
  const { room, member } = memberFor(code, playerId, sessionId);
  member.connections.add(socketId);
  broadcast(room);
  return () => { member.connections.delete(socketId); broadcast(room); };
}
export function setTournamentSettings(code: string, playerId: string, sessionId: string | undefined, settings: TournamentSettings) {
  const { room, member } = hostFor(code, playerId, sessionId);
  if (room.status !== "lobby") throw new TournamentError(409, "Settings can only change before a tournament starts.");
  if (!Number.isInteger(settings.teamCount) || settings.teamCount < 1 || settings.teamCount > 5 || ![1, 3, 5, 7, 10].includes(settings.casesPerTournament) ||
      settings.votingSeconds < 15 || settings.votingSeconds > 180 || !Number.isInteger(settings.votingSeconds))
    throw new TournamentError(400, "Choose 1–5 teams, 1/3/5/7/10 cases, and a 15–180 second timer.");
  if (room.members.some(p => p.teamId >= settings.teamCount)) throw new TournamentError(409, "A team with joined players cannot be removed.");
  while (room.teamNames.length < settings.teamCount) room.teamNames.push(unusedName(room));
  room.teamNames.length = settings.teamCount;
  room.settings = { teamCount: settings.teamCount, casesPerTournament: settings.casesPerTournament, votingSeconds: settings.votingSeconds };
  broadcast(room);
  return view(room, member);
}
function unusedName(room: TournamentRoom) {
  return names.find(name => !room.teamNames.includes(name)) ?? `Team ${room.teamNames.length + 1}`;
}
export function manageTournamentTeam(code: string, playerId: string, sessionId: string | undefined, input: { action: "add" | "remove" | "rename"; teamId?: number; name?: string }) {
  const { room, member } = hostFor(code, playerId, sessionId);
  if (room.status !== "lobby") throw new TournamentError(409, "Manage teams before starting.");
  if (input.action === "add") {
    if (room.settings.teamCount >= 5) throw new TournamentError(409, "Maximum five teams.");
    room.teamNames.push(unusedName(room)); room.settings.teamCount++;
  } else {
    const id = input.teamId;
    if (id === undefined || !Number.isInteger(id) || id < 0 || id >= room.settings.teamCount) throw new TournamentError(400, "Choose an available team.");
    if (input.action === "remove") {
      if (room.settings.teamCount === 1) throw new TournamentError(409, "Keep at least one team.");
      if (room.members.some(p => p.teamId === id)) throw new TournamentError(409, "A team with joined players cannot be removed.");
      room.teamNames.splice(id, 1); room.settings.teamCount--;
      for (const p of room.members) if (p.teamId > id) p.teamId--;
    } else {
      const name = input.name?.trim();
      if (!name || name.length > 30) throw new TournamentError(400, "Enter a team name of 1–30 characters.");
      if (room.teamNames.some((n, i) => i !== id && n.toLowerCase() === name.toLowerCase())) throw new TournamentError(409, "Team names must be unique.");
      room.teamNames[id] = name;
    }
  }
  broadcast(room); return view(room, member);
}
function beginRound(room: TournamentRoom) {
  room.case = generateTournamentCase(difficultySequence(room.settings.casesPerTournament)[room.roundIndex]!, room.usedTitles);
  room.teamRounds.clear();
  for (let id = 0; id < room.settings.teamCount; id++) {
    const stats = room.scores.get(id)!;
    room.teamRounds.set(id, {
      screen: "brief", extras: 0, deadline: null, ready: false,
      ballots: new Map(), princeVoters: new Set(), runoffOptions: [], choice: null, points: 0,
      baseline: { ...stats },
    });
  }
  room.status = "round"; room.revealStage = "culprit";
}
export function startTournament(code: string, playerId: string, sessionId: string | undefined) {
  const { room, member } = hostFor(code, playerId, sessionId);
  if (room.status !== "lobby") throw new TournamentError(409, "The tournament is already active.");
  if (availableTeams(room).some(t => t.playerCount < 1 || t.playerCount > 10)) throw new TournamentError(409, "Each team needs 1-10 players per team before starting.");
  room.roundIndex = 0; room.usedTitles.clear(); room.scores.clear();
  for (let id = 0; id < room.settings.teamCount; id++) room.scores.set(id, initialStats());
  beginRound(room); broadcast(room);
  return view(room, member);
}
function teamFor(code: string, playerId: string, sessionId: string | undefined) {
  const { room, member } = memberFor(code, playerId, sessionId);
  settleExpired(room);
  if (room.status !== "round") throw new TournamentError(409, "No case is accepting actions right now.");
  return { room, member, round: room.teamRounds.get(member.teamId)! };
}
export function advanceTournamentScreen(code: string, playerId: string, sessionId: string | undefined) {
  const context = memberFor(code, playerId, sessionId);
  if (context.room.status === "reveal") {
    const { room, member } = hostFor(code, playerId, sessionId);
    if (room.revealStage === "culprit") room.revealStage = "results";
    else if (room.roundIndex === room.settings.casesPerTournament - 1) { room.status = "finished"; room.revealStage = "champions"; }
    else throw new TournamentError(409, "Start the next case from the results.");
    broadcast(room); return view(room, member);
  }
  const { room, member, round } = teamFor(code, playerId, sessionId);
  const order: Screen[] = ["brief", "roster", "clue1", "clue2", "clue3", "choice"];
  if (round.screen === "extra") round.screen = "choice";
  else if ([...room.teamRounds.values()].every(r => r.screen === "waiting")) {
    hostFor(code, playerId, sessionId);
    room.status = "reveal"; room.revealStage = "culprit";
  }
  else {
    hostFor(code, playerId, sessionId);
    const index = order.indexOf(round.screen);
    if (index < 0 || index >= order.length - 1) throw new TournamentError(409, "Choose an accusation or request another clue.");
    for (const state of room.teamRounds.values()) state.screen = order[index + 1]!;
  }
  broadcast(room);
  return view(room, member);
}
export function requestTournamentClue(code: string, playerId: string, sessionId: string | undefined) {
  const { room, member, round } = teamFor(code, playerId, sessionId);
  if (round.screen !== "choice" || round.ready || round.extras >= 7) throw new TournamentError(409, "No more extra clues are available.");
  round.extras++;
  round.screen = "extra";
  broadcast(room);
  return view(room, member);
}
export function beginTournamentVote(code: string, playerId: string, sessionId: string | undefined) {
  const { room, member, round } = teamFor(code, playerId, sessionId);
  if (round.screen !== "choice" && round.screen !== "extra") throw new TournamentError(409, "Review the three initial clues first.");
  if (member.id !== room.hostId) {
    round.ready = true; round.screen = "choice";
  } else {
    const deadline = Date.now() + room.settings.votingSeconds * 1000;
    for (const state of room.teamRounds.values()) {
      state.screen = "vote"; state.deadline = deadline; state.ready = true; state.ballots.clear();
    }
  }
  broadcast(room);
  return view(room, member);
}
function finishTeam(room: TournamentRoom, id: number, suspect: string | null) {
  const round = room.teamRounds.get(id)!;
  if (round.screen === "waiting") return;
  round.choice = suspect;
  round.points = suspect === room.case!.culprit ? basePoints(room.case!.difficulty) - round.extras * 10 : 0;
  round.screen = "waiting"; round.deadline = null;
  const stats = room.scores.get(id)!;
  stats.score += round.points;
  stats.extraCluesUsed += round.extras;
  stats.princeBlames += round.princeVoters.size;
  if (round.points) {
    stats.correctCount++;
    stats.boldMin = Math.min(stats.boldMin, round.extras);
    if (room.case!.isCoffee && round.extras === 0) stats.coffeeSolves++;
  }
}
function settleBallot(room: TournamentRoom, id: number) {
  const round = room.teamRounds.get(id)!;
  if (round.screen !== "vote" && round.screen !== "runoff") return;
  const counts = new Map<string, number>();
  for (const suspect of round.ballots.values()) counts.set(suspect, (counts.get(suspect) ?? 0) + 1);
  if (!counts.size) { finishTeam(room, id, null); return; }
  const highest = Math.max(...counts.values());
  const tied = [...counts].filter(([, count]) => count === highest).map(([name]) => name);
  if (tied.length === 1) { finishTeam(room, id, tied[0]!); return; }
  if (round.screen === "runoff") { finishTeam(room, id, tied[randomInt(tied.length)]!); return; }
  round.runoffOptions = tied;
  round.screen = "runoff";
  round.ballots.clear();
  round.deadline = Date.now() + 30_000;
}
function settleExpired(room: TournamentRoom) {
  if (room.status !== "round") return;
  let changed = false;
  for (const [id, round] of room.teamRounds) {
    if ((round.screen === "vote" || round.screen === "runoff") && round.deadline !== null && round.deadline <= Date.now()) {
      settleBallot(room, id); changed = true;
    }
  }
  if (changed) broadcast(room);
}
export function castTournamentBallot(code: string, playerId: string, sessionId: string | undefined, suspect: string) {
  const { room, member, round } = teamFor(code, playerId, sessionId);
  if (round.screen !== "vote" && round.screen !== "runoff") throw new TournamentError(409, "Voting is not open for your team.");
  if (!characters.some(c => c.name === suspect) || (round.screen === "runoff" && !round.runoffOptions.includes(suspect)))
    throw new TournamentError(400, "Choose an available character.");
  if (round.ballots.has(member.id)) throw new TournamentError(409, "You already voted.");
  if (round.deadline === null || round.deadline <= Date.now()) {
    settleExpired(room);
    throw new TournamentError(409, "Voting time has expired.");
  }
  round.ballots.set(member.id, suspect);
  if (suspect === "Prince Boni") round.princeVoters.add(member.id);
  const teamSize = room.members.filter(p => p.teamId === member.teamId).length;
  if (round.ballots.size === teamSize) settleBallot(room, member.teamId);
  broadcast(room);
  return view(room, member);
}
export function nextTournamentRound(code: string, playerId: string, sessionId: string | undefined) {
  const { room, member } = hostFor(code, playerId, sessionId);
  if (room.status !== "reveal" || room.revealStage !== "results") throw new TournamentError(409, "Wait for every team and reveal the results first.");
  room.roundIndex++;
  beginRound(room); broadcast(room);
  return view(room, member);
}
export function resetTournament(code: string, playerId: string, sessionId: string | undefined) {
  const { room, member } = hostFor(code, playerId, sessionId);
  if (room.status !== "finished") throw new TournamentError(409, "Finish the tournament before starting a new one.");
  room.status = "lobby"; room.revealStage = "culprit"; room.roundIndex = 0; room.case = null; room.teamRounds.clear();
  room.scores.clear(); room.usedTitles.clear();
  broadcast(room);
  return view(room, member);
}
setInterval(() => {
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  for (const [code, room] of rooms) {
    settleExpired(room);
    if (room.updatedAt < cutoff && room.members.every(p => p.connections.size === 0)) rooms.delete(code);
  }
}, 250).unref();
