import { randomInt, randomUUID } from "node:crypto";
import type { Server as SocketServer } from "socket.io";
import type { Evidence, InvestigationAction, PlayerRole, RoomMessage, RoomStatus, RoomView, RoomSettings } from "@workspace/api-zod";
import { actions, generateCase, methods, motives, roleDescriptions, roles, type GeneratedCase } from "./content";

interface Player { id: string; sessionId: string; displayName: string; role: PlayerRole; connections: Set<string>; extraClue: Evidence | null; interviewed: boolean }
interface Room {
  code: string; hostId: string; status: RoomStatus; players: Player[];
  game: GeneratedCase | null; evidence: Evidence[]; messages: RoomMessage[];
  votes: Map<string, InvestigationAction>; remaining: number;
  resolution: RoomView["resolution"]; updatedAt: number;
  caseId: string; settings: RoomSettings;
}
export class GameError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const rooms = new Map<string, Room>();
let io: SocketServer | undefined;
export const attachRealtime = (server: SocketServer) => { io = server; };
const requireRoom = (code: string) => {
  const room = rooms.get(code.toUpperCase());
  if (!room) throw new GameError(404, "That room was not found. Check the code or create a new case.");
  room.updatedAt = Date.now();
  return room;
};
export function requirePlayer(code: string, playerId: string, sessionId: string | undefined) {
  const room = requireRoom(code);
  const player = room.players.find(p => p.id === playerId && p.sessionId === sessionId);
  if (!player) throw new GameError(403, "This browser is not a member of that case room.");
  return { room, player };
}
function view(room: Room, player: Player): RoomView {
  return {
    code: room.code, status: room.status, hostId: room.hostId,
    caseId: room.caseId, settings: { ...room.settings }, motives, methods,
    players: room.players.map(p => ({ id: p.id, displayName: p.displayName, role: p.role, isHost: p.id === room.hostId, connected: p.connections.size > 0 })),
    me: { id: player.id, role: player.role, roleDescription: roleDescriptions[player.role], privateBrief: room.game?.roleBriefs[player.role] ?? "Your specialist briefing arrives when the host starts the case.", extraClue: player.extraClue, extraInterviewAvailable: player.role === "Interviewer" && !player.interviewed && room.status === "investigation" },
    case: room.game ? { ...room.game.details, rumors: room.settings.rumorsEnabled ? room.game.details.rumors : [] } : null, evidence: room.evidence,
    timeline: room.game?.timeline ?? [], messages: room.settings.chatEnabled ? room.messages : [],
    votes: actions.map(action => ({ action, count: [...room.votes.values()].filter(a => a === action).length, playerIds: [...room.votes.entries()].filter(([, a]) => a === action).map(([id]) => id) })),
    actionsRemaining: room.remaining, investigationLimit: 6,
    teamScore: room.resolution?.score ?? 0, resolution: room.resolution,
  };
}
export function broadcast(room: Room) {
  for (const player of room.players) for (const socketId of player.connections) io?.to(socketId).emit("room:update", view(room, player));
}
const message = (room: Room, text: string) => {
  if (!room.settings.chatEnabled) return;
  room.messages.push({ id: randomUUID(), playerId: "agency", displayName: "Case Desk", text, createdAt: new Date().toISOString() });
  room.messages = room.messages.slice(-150);
};
function addPlayer(room: Room, displayName: string, sessionId: string) {
  if (room.players.length >= 10) throw new GameError(409, "This room has reached its 10-player limit.");
  const cleanName = displayName.trim();
  if (!cleanName) throw new GameError(400, "Enter your investigator name.");
  if (room.players.some(p => p.displayName.toLowerCase() === cleanName.toLowerCase())) throw new GameError(409, "That investigator name is already in this room.");
   const counts = roles.map(role => ({ role, count: room.players.filter(p => p.role === role).length }));
   const lowest = Math.min(...counts.map(r => r.count));
   const available = counts.filter(r => r.count === lowest);
   const player: Player = { id: randomUUID(), sessionId, displayName: cleanName, role: available[randomInt(available.length)]!.role, connections: new Set(), extraClue: null, interviewed: false };
  room.players.push(player);
  return player;
}
export function createRoom(displayName: string, sessionId: string) {
  if (rooms.size >= 500) throw new GameError(503, "The case desk is busy. Please try again shortly.");
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code: string;
  do { code = Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join(""); } while (rooms.has(code));
  const room: Room = { code, hostId: "", status: "lobby", players: [], game: null, evidence: [], messages: [], votes: new Map(), remaining: 6, resolution: null, updatedAt: Date.now(), caseId: randomUUID(), settings: { rumorsEnabled: true, chatEnabled: true } };
  const player = addPlayer(room, displayName, sessionId);
  room.hostId = player.id;
  rooms.set(code, room);
  message(room, "Room opened. Invite your team using the six-character room code. Two to ten investigators can play.");
  return view(room, player);
}
export function joinRoom(code: string, displayName: string, sessionId: string) {
  const room = requireRoom(code);
  if (room.status !== "lobby") throw new GameError(409, "This case is already in progress. Ask the host to open a new room.");
  const player = addPlayer(room, displayName, sessionId);
  message(room, `${player.displayName} joined the investigation team.`);
  broadcast(room);
  return view(room, player);
}
export function getRoom(code: string, playerId: string, sessionId: string | undefined) {
  const { room, player } = requirePlayer(code, playerId, sessionId);
  return view(room, player);
}
export function connectPlayer(code: string, playerId: string, sessionId: string | undefined, socketId: string) {
  const { room, player } = requirePlayer(code, playerId, sessionId);
  player.connections.add(socketId);
  broadcast(room);
  return () => { player.connections.delete(socketId); room.votes.delete(player.id); broadcast(room); };
}
export function startGame(code: string, playerId: string, sessionId: string | undefined) {
  const { room, player } = requirePlayer(code, playerId, sessionId);
  if (player.id !== room.hostId) throw new GameError(403, "Only the host can open the case.");
  if (room.status !== "lobby") throw new GameError(409, "Use the host's Start New Case control to replace an existing case.");
  if (room.players.length < 2) throw new GameError(409, "Invite at least one teammate before starting.");
  beginCase(room);
  message(room, `${room.game!.details.title} is now open. Discuss your specialist briefings and vote on the next investigation.`);
  broadcast(room);
  return view(room, player);
}
function beginCase(room: Room) {
  room.game = generateCase(); room.caseId = randomUUID(); room.status = "investigation";
  room.evidence = []; room.messages = []; room.remaining = 6; room.resolution = null; room.votes.clear();
  for (const p of room.players) {
    p.interviewed = false;
    p.extraClue = p.role === "Forensics Expert"
      ? { id: randomUUID(), action: "analyze-evidence", heading: "Private revision trace", text: room.game.forensicClue, foundAt: new Date().toISOString(), privateTo: p.id }
      : null;
  }
}
function requireHost(code: string, playerId: string, sessionId: string | undefined) {
  const membership = requirePlayer(code, playerId, sessionId);
  if (membership.player.id !== membership.room.hostId) throw new GameError(403, "Only the host can change these controls.");
  return membership;
}
export function updateSettings(code: string, playerId: string, sessionId: string | undefined, settings: RoomSettings) {
  const { room, player } = requireHost(code, playerId, sessionId);
  room.settings = { rumorsEnabled: settings.rumorsEnabled, chatEnabled: settings.chatEnabled };
  if (!settings.chatEnabled) room.messages = [];
  broadcast(room);
  return view(room, player);
}
export function resetGame(code: string, playerId: string, sessionId: string | undefined) {
  const { room, player } = requireHost(code, playerId, sessionId);
  room.caseId = randomUUID(); room.game = null; room.status = "lobby"; room.evidence = [];
  room.messages = []; room.remaining = 6; room.resolution = null; room.votes.clear();
  for (const p of room.players) { p.extraClue = null; p.interviewed = false; }
  broadcast(room);
  return view(room, player);
}
export function startNewCase(code: string, playerId: string, sessionId: string | undefined) {
  const { room, player } = requireHost(code, playerId, sessionId);
  if (room.players.length < 2) throw new GameError(409, "Invite at least one teammate before starting.");
  beginCase(room);
  message(room, `${room.game!.details.title} is now open. All previous case and chat state has been discarded.`);
  broadcast(room);
  return view(room, player);
}
function investigate(room: Room, action: InvestigationAction) {
  const clue = { ...room.game!.clues[action], foundAt: new Date().toISOString() };
  room.evidence.push(clue); room.remaining -= 1; room.votes.clear();
  message(room, `Investigation completed: ${clue.heading}. ${room.remaining} team actions remain.`);
}
export function castVote(code: string, playerId: string, sessionId: string | undefined, action: InvestigationAction) {
  const { room, player } = requirePlayer(code, playerId, sessionId);
  if (!actions.includes(action)) throw new GameError(400, "Choose an available investigation action.");
  if (room.status !== "investigation" || room.remaining < 1) throw new GameError(409, "Investigation actions are finished. Discuss the evidence and submit an accusation.");
  if (room.evidence.some(e => e.action === action)) throw new GameError(409, "The team has already completed that action.");
  room.votes.set(player.id, action);
  const active = room.players.filter(p => p.connections.size > 0 || p.id === player.id);
  const voters = active.length > 0 ? active : room.players;
  const counts = actions.map(a => ({ action: a, count: voters.filter(p => room.votes.get(p.id) === a).length })).sort((a,b) => b.count - a.count);
  const best = counts[0]!;
  if (best.count > voters.length / 2) investigate(room, best.action);
  else if (voters.every(p => room.votes.has(p.id))) {
    const tied = counts.filter(c => c.count === best.count);
    const hostVote = room.votes.get(room.hostId);
    const winner = tied.find(c => c.action === hostVote) ?? tied[0]!;
    investigate(room, winner.action);
  }
  broadcast(room);
  return view(room, player);
}
export function sendMessage(code: string, playerId: string, sessionId: string | undefined, text: string) {
  const { room, player } = requirePlayer(code, playerId, sessionId);
  if (!room.settings.chatEnabled) throw new GameError(403, "The host has disabled team chat.");
  if (!text.trim()) throw new GameError(400, "Enter a message first.");
  room.messages.push({ id: randomUUID(), playerId, displayName: player.displayName, text: text.trim(), createdAt: new Date().toISOString() });
  room.messages = room.messages.slice(-150);
  broadcast(room);
  return view(room, player);
}
export function extraInterview(code: string, playerId: string, sessionId: string | undefined) {
  const { room, player } = requirePlayer(code, playerId, sessionId);
  if (room.status !== "investigation" || player.role !== "Interviewer" || player.interviewed) throw new GameError(409, "Your free interview question is not available.");
  player.interviewed = true;
  player.extraClue = { id: randomUUID(), action: "interview-suspect", heading: "Private follow-up testimony", text: room.game!.interviewClue, foundAt: new Date().toISOString(), privateTo: player.id };
  broadcast(room);
  return view(room, player);
}
export function accuse(code: string, playerId: string, sessionId: string | undefined, accusation: { suspect: string; motive: string; method: string }) {
  const { room, player } = requirePlayer(code, playerId, sessionId);
  if (room.status !== "investigation") throw new GameError(409, "This case is not accepting an accusation.");
  if (player.id !== room.hostId) throw new GameError(403, "Only the host can submit the team's final accusation.");
  if (!room.game!.details.suspects.some(s => s.name === accusation.suspect) || !motives.includes(accusation.motive) || !methods.includes(accusation.method)) throw new GameError(400, "Choose a suspect, motive, and method from this case.");
  const solution = room.game!.solution;
  const bonus = room.remaining * 10;
  const score = (accusation.suspect === solution.suspect ? 50 : 0) + (accusation.motive === solution.motive ? 25 : 0) + (accusation.method === solution.method ? 25 : 0) + bonus;
  const rank = score >= 130 ? "Master Detectives" : score >= 100 ? "Elite Detectives" : score >= 75 ? "Senior Investigators" : score >= 50 ? "Junior Investigators" : "Rookie Detectives";
  room.resolution = { ...solution, score, remainingActionBonus: bonus, rank, clueExplanations: room.game!.explanations };
  room.status = "resolved"; room.votes.clear();
  message(room, `Case closed. The team's score is ${score} points, including ${bonus} for unused investigation actions.`);
  broadcast(room);
  return view(room, player);
}
setInterval(() => {
  const cutoff = Date.now() - 6 * 60 * 60 * 1000;
  for (const [code, room] of rooms) if (room.updatedAt < cutoff && room.players.every(p => p.connections.size === 0)) rooms.delete(code);
}, 60_000).unref();
