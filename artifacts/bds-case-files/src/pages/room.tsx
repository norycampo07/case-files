import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetRoom, getGetRoomQueryKey, useStartGame, useCastInvestigationVote, useSendRoomMessage,
  useSubmitAccusation, useJoinRoom, type RoomView, type Evidence, type InvestigationAction,
} from "@workspace/api-client-react";
import { useRoomSocket, type ConnState } from "@/hooks/use-room-socket";
import { loadSession, saveSession, clearSession, ACTION_LABELS } from "@/lib/session";
import { HostControls } from "@/components/host-controls";
import { Lock, Send, Crown, Copy, Check, Wifi, WifiOff, Gavel, Clock, FileText, UserSearch } from "lucide-react";

const btnGold = "bg-primary text-primary-foreground font-semibold px-4 py-2.5 rounded hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed";
const panel = "border border-border bg-card rounded";

function ConnPill({ s }: { s: ConnState }) {
  const map = { live: ["Live", "text-primary"], connecting: ["Connecting", "text-muted-foreground"], offline: ["Offline - polling", "text-destructive"] } as const;
  const [t, c] = map[s];
  return <span data-testid="status-connection" className={"inline-flex items-center gap-1.5 text-xs font-mono " + c}>{s === "offline" ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}{t}</span>;
}

export default function Room() {
  const params = useParams<{ code: string }>();
  const code = (params.code || "").toUpperCase();
  const [, nav] = useLocation();
  const [session, setSession] = useState(() => { const s = loadSession(); return s && s.code === code ? s : null; });

  if (!session) return <JoinGate code={code} onJoined={(s) => setSession(s)} onHome={() => nav("/")} />;
  return <RoomInner code={code} playerId={session.playerId} onLeave={() => { clearSession(); nav("/"); }} />;
}

function JoinGate({ code, onJoined, onHome }: { code: string; onJoined: (s: { code: string; playerId: string }) => void; onHome: () => void }) {
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const join = useJoinRoom();
  return (
    <div className="min-h-[100dvh] board-bg grid place-items-center p-5">
      <form onSubmit={(e) => { e.preventDefault(); setErr(""); join.mutate({ code, data: { displayName: name.trim(), consentAcknowledged: true } }, {
        onSuccess: (r) => { const s = { code: r.code, playerId: r.me.id }; saveSession(s); onJoined(s); },
        onError: () => setErr("Could not join. The case may not exist or has already started."),
      }); }} className="paper rounded p-8 w-full max-w-sm space-y-4 border-l-[14px] border-primary/80">
        <p className="font-mono text-xs uppercase tracking-widest opacity-60">Case {code}</p>
        <h1 className="font-display text-3xl">Join this case</h1>
        <label className="block text-sm">Fictional detective alias<input data-testid="input-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} placeholder="Inspector Pencil" className="mt-1 w-full bg-white/70 border border-slate-400 px-3 py-2 rounded" /></label>
        <p className="text-xs opacity-70">Use a made-up alias. Do not enter personal information.</p>
        {err && <p className="text-sm text-red-700">{err}</p>}
        <button data-testid="button-join" disabled={!name.trim() || join.isPending} className="w-full bg-[hsl(222,45%,12%)] text-[hsl(43,70%,60%)] font-semibold py-3 rounded disabled:opacity-50">Join case</button>
        <button type="button" onClick={onHome} className="text-sm underline w-full">Back to agency</button>
      </form>
    </div>
  );
}

function RoomInner({ code, playerId, onLeave }: { code: string; playerId: string; onLeave: () => void }) {
  const conn = useRoomSocket(code, playerId);
  const key = getGetRoomQueryKey(code, { playerId });
  const q = useGetRoom(code, { playerId }, { query: { queryKey: key, refetchInterval: conn === "live" ? 20000 : 3000, retry: 1 } });
  const room = q.data;

  if (q.isLoading) return <div className="min-h-[100dvh] p-8 max-w-5xl mx-auto space-y-4">{[0,1,2].map(i => <div key={i} className="h-24 bg-card rounded animate-pulse" />)}</div>;
  if (!room) return (
    <div className="min-h-[100dvh] grid place-items-center p-5"><div className={panel + " p-8 max-w-sm text-center space-y-4"}>
      <h1 className="font-display text-2xl">Case file unavailable</h1>
      <p className="text-muted-foreground text-sm">We could not load case {code}.</p>
      <div className="flex gap-2 justify-center"><button data-testid="button-retry" className={btnGold} onClick={() => q.refetch()}>Retry</button>
      <button data-testid="button-leave" className="border border-border px-4 py-2 rounded" onClick={onLeave}>Leave</button></div></div></div>
  );
  return <RoomScreen room={room} conn={conn} playerId={playerId} onLeave={onLeave} />;
}

function RoomScreen({ room, conn, playerId, onLeave }: { room: RoomView; conn: ConnState; playerId: string; onLeave: () => void }) {
  const qc = useQueryClient();
  const key = getGetRoomQueryKey(room.code, { playerId });
  const isHost = room.hostId === playerId;
  const apply = (v: RoomView) => qc.setQueryData(key, v);
  const [err, setErr] = useState("");
  const onErr = () => setErr("That did not go through. Check the state of the case and try again.");
  const start = useStartGame();
  const vote = useCastInvestigationVote();
  const [copied, setCopied] = useState(false);

  return (
    <div className="min-h-[100dvh] board-bg">
      <header className="border-b border-border bg-background/90 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <button onClick={onLeave} data-testid="button-leave" className="font-display text-primary font-bold text-lg">BDS</button>
          <div className="min-w-0 flex-1">
            <div className="font-display text-lg truncate" data-testid="text-case-title">{room.case?.title ?? "Case lobby"}</div>
            <div className="text-xs text-muted-foreground font-mono">Case {room.code} / {room.players.filter(p => p.connected).length} of {room.players.length} connected</div>
          </div>
          {room.status === "investigation" && (
            <div className="flex items-center gap-4 text-sm font-mono">
              <span data-testid="text-actions-remaining">Actions <b className="text-primary">{room.actionsRemaining}</b>/{room.investigationLimit}</span>
              <span>Score <b className="text-primary">{room.teamScore}</b></span>
            </div>
          )}
          <ConnPill s={conn} />
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 grid lg:grid-cols-[1fr_340px] gap-5">
        <main className="space-y-5 min-w-0">
          {err && <div data-testid="text-error" className="border border-destructive/60 bg-destructive/10 px-3 py-2 rounded text-sm flex justify-between"><span>{err}</span><button onClick={() => setErr("")}>Dismiss</button></div>}
          {room.status === "lobby" && (
            <section className={panel + " p-6"}>
              <p className="font-mono text-xs uppercase tracking-widest text-primary">Waiting room</p>
              <h1 className="font-display text-3xl mt-1">Assemble the team</h1>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span data-testid="text-room-code" className="font-mono text-3xl tracking-[0.35em] border border-primary px-4 py-2 text-primary">{room.code}</span>
                <button data-testid="button-copy" className="border border-border px-3 py-2 rounded text-sm flex items-center gap-2" onClick={() => { navigator.clipboard?.writeText(room.code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? "Copied" : "Copy code"}</button>
              </div>
              <ul className="mt-6 grid sm:grid-cols-2 gap-2">
                {room.players.map((p) => (
                  <li key={p.id} data-testid={"row-player-" + p.id} className="flex items-center gap-3 border border-border rounded px-3 py-2 bg-background/50">
                    <span className="h-8 w-8 rounded-full bg-primary/20 text-primary grid place-items-center font-semibold">{p.displayName.slice(0, 1).toUpperCase()}</span>
                    <span className="flex-1 truncate">{p.displayName}{p.id === playerId && <span className="text-muted-foreground"> (you)</span>}</span>
                    <span className={"text-xs " + (p.connected ? "text-primary" : "text-muted-foreground")}>{p.connected ? "Online" : "Offline"}</span>
                    {p.isHost && <Crown className="h-4 w-4 text-primary" />}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {isHost ? (
                  <button data-testid="button-start" disabled={room.players.length < 2 || start.isPending} className={btnGold}
                    onClick={() => { setErr(""); start.mutate({ code: room.code, data: { playerId } }, { onSuccess: apply, onError: onErr }); }}>
                    {start.isPending ? "Opening file..." : "Begin investigation"}</button>
                ) : <p className="text-sm text-muted-foreground">Waiting for the host to begin.</p>}
                {isHost && room.players.length < 2 && <p className="text-sm text-muted-foreground mt-2">At least 2 players are needed.</p>}
              </div>
            </section>
          )}

           {room.status !== "lobby" && room.case && <CaseBody key={room.caseId} room={room} playerId={playerId} isHost={isHost} apply={apply} onErr={onErr} vote={vote} />}
          {room.status === "resolved" && room.resolution && <Resolution room={room} />}
        </main>

        <aside className="space-y-5">
          <RolePanel room={room} playerId={playerId} apply={apply} />
           {isHost ? <HostControls room={room} playerId={playerId} apply={apply} /> :
             <p className="border border-border rounded p-3 text-xs text-muted-foreground">Host settings: rumors {room.settings.rumorsEnabled ? "on" : "off"} · chat {room.settings.chatEnabled ? "on" : "off"}</p>}
           {room.settings.chatEnabled ? <Chat key={`chat-${room.caseId}`} room={room} playerId={playerId} /> :
             <section className={panel + " p-4"} data-testid="text-chat-disabled"><h2 className="font-display text-lg">Team chat is disabled</h2><p className="text-xs text-muted-foreground mt-2">The host switched off chat and discarded its messages. Discuss clues on your team call.</p></section>}
           <Notebook key={`notes-${room.caseId}`} />
        </aside>
      </div>
    </div>
  );
}

function RolePanel({ room, playerId, apply }: { room: RoomView; playerId: string; apply: (v: RoomView) => void }) {
  const me = room.me;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const interview = async () => {
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/rooms/" + room.code + "/interview", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ playerId }) });
      if (!r.ok) throw new Error();
      const v = await r.json();
      if (v && v.code && v.me) apply(v as RoomView);
    } catch { setMsg("Follow-up interview failed."); }
    setBusy(false);
  };
  return (
    <section className="paper rounded p-4 border-l-[10px] border-primary/80" data-testid="panel-role">
      <p className="font-mono text-[11px] uppercase tracking-widest opacity-60">Your role (private)</p>
      <h2 className="font-display text-xl" data-testid="text-role">{me.role}</h2>
      <p className="text-sm mt-1">{me.roleDescription}</p>
      {room.status !== "lobby" && me.privateBrief && <div className="mt-3 text-sm border-t border-slate-400/50 pt-2"><b>Private brief.</b> {me.privateBrief}</div>}
      {me.extraClue && <div className="mt-3 text-sm border-t border-slate-400/50 pt-2" data-testid="text-extra-clue"><b>{me.extraClue.heading}.</b> {me.extraClue.text}</div>}
      {room.status === "investigation" && me.extraInterviewAvailable && (
        <button data-testid="button-extra-interview" disabled={busy} onClick={interview} className="mt-3 w-full bg-[hsl(222,45%,12%)] text-[hsl(43,70%,60%)] text-sm font-semibold py-2 rounded disabled:opacity-50">
          {busy ? "Interviewing..." : "Free follow-up interview"}</button>
      )}
      {msg && <p className="text-xs text-red-700 mt-1">{msg}</p>}
    </section>
  );
}

function EvidenceCard({ e, index }: { e: Evidence; index: number }) {
  return (
    <article data-testid={"card-evidence-" + e.id} className="paper rounded p-4 relative">
      <div className="flex justify-between gap-2 font-mono text-[11px] uppercase tracking-wider opacity-70">
        <span>Exhibit {index + 1} / {ACTION_LABELS[e.action]?.label ?? e.action}</span>
        {e.privateTo && <span className="flex items-center gap-1"><Lock className="h-3 w-3" />Private</span>}
      </div>
      <h3 className="font-display text-lg mt-1">{e.heading}</h3>
      <p className="text-sm mt-1">{e.text}</p>
      <p className="text-xs mt-2 opacity-60">Found at {e.foundAt}</p>
    </article>
  );
}

function CaseBody({ room, playerId, isHost, apply, onErr, vote }: { room: RoomView; playerId: string; isHost: boolean; apply: (v: RoomView) => void; onErr: () => void; vote: ReturnType<typeof useCastInvestigationVote> }) {
  const c = room.case!;
  const [tab, setTab] = useState<"brief" | "board" | "suspects" | "accuse">("brief");
  const live = room.status === "investigation";
  const used = useMemo(() => new Set(room.evidence.map((e) => e.action)), [room.evidence]);
  const myVote = room.votes.find((v) => v.playerIds.includes(playerId))?.action;
  const tabs = [["brief", "Brief"], ["board", "Evidence board"], ["suspects", "Suspects"], ...(live ? [["accuse", "Accusation"]] : [])] as [typeof tab, string][];
  const cast = (action: InvestigationAction) => vote.mutate({ code: room.code, data: { playerId, action } }, { onSuccess: apply, onError: onErr });

  return (
    <>
      <nav className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map(([id, l]) => <button key={id} data-testid={"tab-" + id} onClick={() => setTab(id)} className={"px-4 py-2 text-sm whitespace-nowrap border-b-2 " + (tab === id ? "border-primary text-primary font-semibold" : "border-transparent text-muted-foreground")}>{l}</button>)}
      </nav>

      {tab === "brief" && (
        <section className={panel + " p-6"}>
          <p className="font-mono text-xs uppercase tracking-widest text-primary">{c.location}</p>
          <h1 className="font-display text-3xl mt-1">{c.title}</h1>
          <p className="mt-3 font-semibold">{c.crime}</p>
          <p className="mt-2 text-muted-foreground">{c.openingBrief}</p>
           <h2 className="font-display text-xl mt-5">Initial evidence</h2>
           <ul className="mt-2 list-disc pl-5 space-y-2 text-sm" data-testid="list-initial-evidence">{c.initialEvidence.map(text => <li key={text}>{text}</li>)}</ul>
           <h2 className="font-display text-xl mt-5">Suspect roster</h2>
           <p className="text-sm text-muted-foreground">All are fictional workplace characters, not real employees.</p>
           <ul className="grid sm:grid-cols-2 gap-2 mt-3 text-sm">{c.suspects.map(s => <li key={s.name}><b>{s.name}</b> · {s.title}</li>)}</ul>
           <OfficeRumors room={room} />
        </section>
      )}

      {tab === "board" && (
        <>
          {live && (
            <section className={panel + " p-4"}>
              <div className="flex items-center gap-2 mb-1"><Gavel className="h-4 w-4 text-primary" /><h2 className="font-display text-xl">Vote the next action</h2></div>
              <p className="text-xs text-muted-foreground mb-3">Majority executes. In a full tie the host's vote decides. Changing your vote is allowed until it resolves.</p>
              {room.actionsRemaining <= 0 && <p className="text-sm text-primary mb-2">No actions left. The host must file the accusation.</p>}
              <div className="grid sm:grid-cols-2 gap-2">
                {Object.entries(ACTION_LABELS).map(([a, m]) => {
                  const done = used.has(a as InvestigationAction);
                  const t = room.votes.find((v) => v.action === a);
                  const mine = myVote === a;
                  return (
                    <button key={a} data-testid={"button-vote-" + a} disabled={done || room.actionsRemaining <= 0 || vote.isPending} onClick={() => cast(a as InvestigationAction)}
                      className={"text-left p-3 rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed " + (mine ? "border-primary bg-primary/15" : "border-border bg-background/40 hover:border-primary/60")}>
                      <div className="flex justify-between"><span className="font-semibold text-sm">{m.label}</span>
                        <span className="font-mono text-xs text-primary">{done ? "Done" : t ? t.count + " / " + room.players.length : ""}</span></div>
                      <div className="text-xs text-muted-foreground">{m.hint}</div>
                      {t && !done && <div className="text-[11px] mt-1 text-muted-foreground">{t.playerIds.map((id) => room.players.find((p) => p.id === id)?.displayName).filter(Boolean).join(", ")}</div>}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
          <section>
            <h2 className="font-display text-xl mb-2">Evidence</h2>
             <div className="border border-border rounded p-4 mb-3 text-sm"><h3 className="font-semibold mb-2">Initial evidence</h3>{c.initialEvidence.map(text => <p className="mb-2 text-muted-foreground" key={text}>{text}</p>)}</div>
            {room.evidence.length === 0 ? <div className={panel + " p-6 text-sm text-muted-foreground"} data-testid="text-no-evidence">The board is empty. Vote on an action to pin the first exhibit.</div> :
              <div className="grid sm:grid-cols-2 gap-3">{room.evidence.map((e, i) => <EvidenceCard key={e.id} e={e} index={i} />)}</div>}
          </section>
           <OfficeRumors room={room} />
          <section className={panel + " p-4"}>
            <div className="flex items-center gap-2 mb-2"><Clock className="h-4 w-4 text-primary" /><h2 className="font-display text-xl">Timeline</h2></div>
            {room.timeline.length === 0 ? <p className="text-sm text-muted-foreground">No timeline entries yet.</p> :
              <ol className="border-l border-primary/50 ml-1 space-y-3">{room.timeline.map((t, i) => <li key={i} className="pl-4"><span className="font-mono text-xs text-primary">{t.time}</span><p className="text-sm">{t.event}</p></li>)}</ol>}
          </section>
        </>
      )}

      {tab === "suspects" && (
        <section className="grid sm:grid-cols-2 gap-3">
          {c.suspects.map((s) => (
            <article key={s.name} data-testid={"card-suspect-" + s.name} className="paper rounded p-4">
              <div className="flex items-center gap-3">
                <span className="h-11 w-11 bg-[hsl(222,45%,12%)] text-[hsl(43,70%,60%)] grid place-items-center font-display text-lg"><UserSearch className="h-5 w-5" /></span>
                <div><h3 className="font-display text-lg leading-tight">{s.name}</h3><p className="text-xs opacity-70">{s.title}</p></div>
              </div>
              <p className="text-sm mt-3">{s.profile}</p>
               <p className="text-sm mt-2"><b>Quirk.</b> {s.suspiciousTrait}</p>
              <p className="text-sm mt-2 border-t border-slate-400/50 pt-2"><b>Alibi.</b> {s.alibi}</p>
            </article>
          ))}
        </section>
      )}

      {tab === "accuse" && live && <Accuse room={room} playerId={playerId} isHost={isHost} apply={apply} onErr={onErr} />}
    </>
  );
}

function Accuse({ room, playerId, isHost, apply, onErr }: { room: RoomView; playerId: string; isHost: boolean; apply: (v: RoomView) => void; onErr: () => void }) {
  const sub = useSubmitAccusation();
  const [suspect, setSuspect] = useState("");
  const [motive, setMotive] = useState("");
  const [method, setMethod] = useState("");
  const [confirm, setConfirm] = useState(false);
  const sel = "mt-1 w-full bg-background border border-input rounded px-3 py-2";
  if (!isHost) return <section className={panel + " p-6"}><h2 className="font-display text-2xl">Final accusation</h2><p className="text-muted-foreground mt-2 text-sm">Only the host files the accusation. Make your case in the team chat.</p></section>;
  return (
    <section className={panel + " p-6 space-y-4"}>
      <h2 className="font-display text-2xl">File the accusation</h2>
      <p className="text-sm text-muted-foreground">One filing, no appeals. Each unspent action is worth 10 points ({room.actionsRemaining} left).</p>
      <label className="block text-sm">Suspect<select data-testid="select-suspect" value={suspect} onChange={(e) => setSuspect(e.target.value)} className={sel}><option value="">Select</option>{room.case!.suspects.map((s) => <option key={s.name}>{s.name}</option>)}</select></label>
      <p className="text-xs text-muted-foreground">These are fictional game labels for a harmless workflow mix-up, not allegations against employees.</p>
      <label className="block text-sm">Motive<select data-testid="select-motive" value={motive} onChange={(e) => setMotive(e.target.value)} className={sel}><option value="">Select</option>{room.motives.map((m) => <option key={m}>{m}</option>)}</select></label>
      <label className="block text-sm">Method<select data-testid="select-method" value={method} onChange={(e) => setMethod(e.target.value)} className={sel}><option value="">Select</option>{room.methods.map((m) => <option key={m}>{m}</option>)}</select></label>
      {!confirm ? <button data-testid="button-accuse" disabled={!suspect || !motive || !method} className={btnGold} onClick={() => setConfirm(true)}>Review accusation</button> :
        <div className="border border-primary p-3 rounded space-y-3"><p className="text-sm">Accuse <b>{suspect}</b> of acting for <b>{motive}</b> via <b>{method}</b>?</p>
          <div className="flex gap-2"><button data-testid="button-confirm-accuse" disabled={sub.isPending} className={btnGold} onClick={() => sub.mutate({ code: room.code, data: { playerId, suspect, motive, method } }, { onSuccess: apply, onError: onErr })}>{sub.isPending ? "Filing..." : "File it"}</button>
            <button className="border border-border px-4 rounded" onClick={() => setConfirm(false)}>Back</button></div></div>}
    </section>
  );
}

function Resolution({ room }: { room: RoomView }) {
  const r = room.resolution!;
  return (
    <section data-testid="panel-resolution" className="paper rounded p-6 border-t-8 border-primary">
      <p className="font-mono text-xs uppercase tracking-widest opacity-60">Case closed</p>
      <h2 className="font-display text-3xl">The solution</h2>
      <dl className="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
        <div><dt className="opacity-60">Fictional suspect</dt><dd className="font-semibold">{r.suspect}</dd></div>
        <div><dt className="opacity-60">Motive</dt><dd className="font-semibold">{r.motive}</dd></div>
        <div><dt className="opacity-60">Method</dt><dd className="font-semibold">{r.method}</dd></div>
      </dl>
      <p className="mt-4 text-sm">{r.summary}</p>
      <p data-testid="text-team-rank" className="font-display text-2xl mt-5">{r.rank}</p>
      <h3 className="font-display text-xl mt-4">How the clues connect</h3>
      <ul className="text-sm list-disc pl-5 mt-2 space-y-2" data-testid="list-clue-explanations">{r.clueExplanations.map(text => <li key={text}>{text}</li>)}</ul>
      <div className="mt-5 flex items-end gap-6"><div><div className="text-xs opacity-60">Team score</div><div data-testid="text-final-score" className="font-display text-5xl">{r.score}</div></div>
        <div className="text-xs opacity-70">Includes {r.remainingActionBonus} points from unspent actions.<br />Scoring: suspect 50, motive 25, method 25.</div></div>
      <a href="/" className="inline-block mt-5 bg-[hsl(222,45%,12%)] text-[hsl(43,70%,60%)] px-4 py-2 rounded font-semibold" data-testid="link-home">Back to agency</a>
    </section>
  );
}

function Chat({ room, playerId }: { room: RoomView; playerId: string }) {
  const send = useSendRoomMessage();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [room.messages.length]);
  return (
    <section className={panel + " flex flex-col h-80"}>
      <h2 className="font-display text-lg px-3 pt-3">Team chat</h2>
      <p className="text-[11px] text-muted-foreground px-3">Session only. Share fictional clues, not personal information.</p>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2" data-testid="list-messages">
        {room.messages.length === 0 && <p className="text-xs text-muted-foreground">No messages yet. Say something to your team.</p>}
        {room.messages.map((m) => <div key={m.id} className="text-sm"><span className={"font-semibold " + (m.playerId === playerId ? "text-primary" : "")}>{m.displayName}</span> <span className="text-muted-foreground">{m.text}</span></div>)}
        <div ref={end} />
      </div>
      <form className="flex gap-2 p-2 border-t border-border" onSubmit={(e) => { e.preventDefault(); const t = text.trim(); if (!t) return;
        send.mutate({ code: room.code, data: { playerId, text: t } }, { onSuccess: (v) => { qc.setQueryData(getGetRoomQueryKey(room.code, { playerId }), v); setText(""); } }); }}>
        <input data-testid="input-chat" value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder="Message" className="flex-1 min-w-0 bg-background border border-input rounded px-3 py-2 text-sm" />
        <button data-testid="button-send" disabled={send.isPending || !text.trim()} className={btnGold + " px-3"} aria-label="Send"><Send className="h-4 w-4" /></button>
      </form>
      {send.isError && <p role="alert" className="text-xs text-destructive px-3 pb-2">Message not sent. Please try again.</p>}
    </section>
  );
}

function Notebook() {
  const [t, setT] = useState("");
  return (
    <section className="paper rounded p-3 border-l-[10px] border-primary/80">
      <div className="flex items-center gap-2"><FileText className="h-4 w-4" /><h2 className="font-display text-lg">My notebook</h2></div>
      <p className="text-[11px] opacity-70 mb-1">Private, in-memory notes. Cleared on reload, reset, or new case. Never saved.</p>
      <textarea data-testid="input-notes" value={t} onChange={(e) => setT(e.target.value)} rows={6} maxLength={3000} placeholder="Theories, contradictions, questions..." className="w-full bg-white/60 border border-slate-400 rounded p-2 text-sm" />
    </section>
  );
}
function OfficeRumors({ room }: { room: RoomView }) {
  return <section className={panel + " p-4 mt-4"} data-testid="panel-rumors">
    <h2 className="font-display text-xl">Office rumor notebook</h2>
    {!room.settings.rumorsEnabled ? <p className="text-sm text-muted-foreground mt-2">Rumors are disabled by the host.</p> : <>
      <p className="text-xs text-muted-foreground mt-1">Playful fictional chatter: mostly harmless, sometimes irrelevant, occasionally a clue. Never an allegation.</p>
      <ul className="list-disc pl-5 text-sm space-y-2 mt-3">{room.case?.rumors.map(text => <li key={text}>{text}</li>)}</ul>
    </>}
  </section>;
}
