import assert from "node:assert/strict";
import test from "node:test";
import { CreateRoomBody, JoinRoomBody, GetRoomResponse } from "@workspace/api-zod";
import { actions, generateCase, roles } from "./content";
import { caseTemplates, methodDetails, motiveDetails, suspects } from "./workplace-data";
import { accuse, castVote, connectPlayer, createRoom, extraInterview, getRoom, joinRoom, resetGame, sendMessage, startGame, startNewCase, updateSettings } from "./rooms";

function team() {
  const host = createRoom("Inspector Pencil", "host-session");
  const guest = joinRoom(host.code, "Agent Stapler", "guest-session");
  connectPlayer(host.code, host.me.id, "host-session", "host-socket");
  connectPlayer(host.code, guest.me.id, "guest-session", "guest-socket");
  return { code: host.code, host: host.me.id, guest: guest.me.id };
}
test("consent is mandatory at the API boundary", () => {
  for (const schema of [CreateRoomBody, JoinRoomBody]) {
    assert.equal(schema.safeParse({ displayName: "Inspector Pencil" }).success, false);
    assert.equal(schema.safeParse({ displayName: "Inspector Pencil", consentAcknowledged: false }).success, false);
    assert.equal(schema.safeParse({ displayName: "Inspector Pencil", consentAcknowledged: true }).success, true);
  }
});
test("template pool covers all safe case types with consistent solutions and 2–4 rumors", () => {
  const titles = new Set<string>();
  const combinations = new Set<string>();
  for (let n = 0; n < 500; n++) {
    const c = generateCase();
    titles.add(c.details.title);
    combinations.add(JSON.stringify({ title: c.details.title, location: c.details.location, solution: c.solution }));
    assert.deepEqual(c.details.suspects.map(s => s.name).sort(), suspects.map(s => s.name).sort());
    assert.ok(c.details.rumors.length >= 2 && c.details.rumors.length <= 4);
    assert.equal(Object.keys(c.clues).length, 10);
    assert.equal(c.details.initialEvidence.length, 2);
    assert.ok(c.clues["review-emails"].text.includes(motiveDetails[c.solution.motive]!));
    assert.ok(c.clues["analyze-evidence"].text.includes(c.solution.method));
    assert.ok(c.clues["review-project-tracker"].text.includes(c.solution.suspect));
    assert.ok(c.explanations.length >= 5);
    assert.ok(Object.keys(methodDetails).includes(c.solution.method));
    assert.doesNotMatch(JSON.stringify(c), /\b(theft|sabotage|revenge|murder|harassment|fraud)\b/i);
  }
  assert.equal(titles.size, caseTemplates.length);
  assert.ok(combinations.size > 400);
});
test("roles are random but balanced, and room capacity stays at ten", () => {
  const room = createRoom("Alias 0", "session0");
  let view = room;
  for (let i = 1; i < 10; i++) view = joinRoom(room.code, `Alias ${i}`, `session${i}`);
  for (const role of roles) assert.equal(view.players.filter(p => p.role === role).length, 2);
  assert.throws(() => joinRoom(room.code, "Alias 10", "session10"), /10-player/);
});
test("host controls synchronize settings and discard chat and case state", () => {
  const t = team();
  assert.throws(() => startGame(t.code,t.guest,"guest-session"), /Only the host/);
  let room = startGame(t.code,t.host,"host-session");
  const previousId = room.caseId;
  sendMessage(t.code,t.guest,"guest-session","Fictional clue, no personal data.");
  assert.throws(() => updateSettings(t.code,t.guest,"guest-session",{ chatEnabled:false,rumorsEnabled:false }), /Only the host/);
  room = updateSettings(t.code,t.host,"host-session",{ chatEnabled:false,rumorsEnabled:false });
  assert.equal(room.messages.length,0);
  assert.equal(room.case!.rumors.length,0);
  assert.throws(() => sendMessage(t.code,t.guest,"guest-session","No"), /disabled/);
  assert.equal(getRoom(t.code,t.guest,"guest-session").settings.chatEnabled,false);
  room = updateSettings(t.code,t.host,"host-session",{ chatEnabled:true,rumorsEnabled:true });
  assert.equal(room.messages.length,0);
  assert.ok(room.case!.rumors.length >= 2);
  assert.throws(() => resetGame(t.code,t.guest,"guest-session"), /Only the host/);
  room = resetGame(t.code,t.host,"host-session");
  assert.equal(room.status,"lobby"); assert.equal(room.case,null);
  assert.notEqual(room.caseId,previousId);
  assert.equal(room.evidence.length,0); assert.equal(room.messages.length,0);
  assert.equal(room.me.extraClue,null); assert.equal(room.resolution,null);
  const resetId=room.caseId;
  room=startNewCase(t.code,t.host,"host-session");
  assert.notEqual(room.caseId,resetId); assert.equal(room.status,"investigation");
  GetRoomResponse.parse(room);
});
test("votes, private specialist evidence, scoring and explanation work end-to-end", () => {
  const t=team();
  let room=startGame(t.code,t.host,"host-session");
  assert.equal(room.resolution,null);
  assert.throws(() => getRoom(t.code,t.host,"guest-session"), /not a member/);
  for(const action of ["review-emails","analyze-evidence","review-project-tracker"] as const) {
    room=castVote(t.code,t.host,"host-session",action);
    assert.equal(room.evidence.some(e=>e.action===action),false);
    room=castVote(t.code,t.guest,"guest-session",action);
    assert.equal(room.evidence.some(e=>e.action===action),true);
  }
  assert.throws(()=>castVote(t.code,t.host,"host-session","review-emails"),/already completed/);
  assert.equal(room.actionsRemaining,3);
  const hostView=getRoom(t.code,t.host,"host-session");
  const guestView=getRoom(t.code,t.guest,"guest-session");
  for (const [id, session, view] of [[t.host,"host-session",hostView],[t.guest,"guest-session",guestView]] as const) {
    if(view.me.role==="Forensics Expert") assert.equal(view.me.extraClue?.privateTo,id);
    else assert.equal(view.me.extraClue,null);
    if(view.me.role==="Interviewer") {
      const extra=extraInterview(t.code,id,session);
      assert.equal(extra.me.extraClue?.privateTo,id);
      assert.equal(extra.actionsRemaining,3);
      assert.throws(()=>extraInterview(t.code,id,session),/not available/);
    }
  }
  const notes=room.evidence.find(e=>e.action==="review-emails")!.text;
  const revision=room.evidence.find(e=>e.action==="analyze-evidence")!.text;
  const suspect=suspects.find(s=>revision.includes(s.name))!.name;
  const motive=Object.keys(motiveDetails).find(m=>notes.includes(motiveDetails[m]!))!;
  const method=Object.keys(methodDetails).find(m=>revision.includes(m))!;
  assert.throws(()=>accuse(t.code,t.guest,"guest-session",{suspect,motive,method}),/Only the host/);
  room=accuse(t.code,t.host,"host-session",{suspect,motive,method});
  assert.equal(room.resolution?.score,130);
  assert.equal(room.resolution?.remainingActionBonus,30);
  assert.equal(room.resolution?.rank,"Master Detectives");
  assert.ok(room.resolution!.clueExplanations.length>0);
  GetRoomResponse.parse(room);
  assert.throws(()=>castVote(t.code,t.host,"host-session",actions[0]!),/finished/);
});
