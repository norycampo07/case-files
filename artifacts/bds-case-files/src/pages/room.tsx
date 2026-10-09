import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetTournament, getGetTournamentQueryKey, useSetTournamentSettings, useStartTournament, useAdvanceTournamentScreen,
  useRequestTournamentClue, useBeginTournamentVote, useNextTournamentRound, useResetTournament, useCastTournamentBallot,
  useManageTournamentTeam, type TournamentView,
} from "@workspace/api-client-react";
import { useRoomSocket, type ConnState } from "@/hooks/use-room-socket";
import { loadSession, clearSession } from "@/lib/session";
import { errMsg } from "@/lib/err";
import { Portrait, Confetti, teamColor, useCountdown } from "@/components/tournament-bits";
import { Wifi, WifiOff, Crown, Copy, Check, ArrowRight, Search, Trophy, Clock, X, Medal, Home, Users, RotateCcw, LogOut, Hourglass, Plus, Trash2, Pencil, Eye, Flag, Gavel, ThumbsUp, ArrowLeft } from "lucide-react";

type Case = NonNullable<TournamentView["case"]>;
type Opts = { onSuccess: (nv: TournamentView) => void; onError: (e: unknown) => void };
type Call = { code: string; data: { playerId: string } };
const eyebrow = "font-mono text-xs uppercase tracking-[0.25em] font-medium text-primary";
const h1 = "font-display text-4xl sm:text-6xl font-extrabold leading-[.98]";

export default function Room() {
  const params = useParams<{ code: string }>();
  const code = (params.code || "").toUpperCase();
  const [, nav] = useLocation();
  const s = loadSession();
  const session = s && s.code === code ? s : null;
  if (!session) return (
    <div className="min-h-[100dvh] stage-bg grid place-items-center p-6 text-center">
      <div className="screen-in max-w-sm space-y-4">
        <p className={eyebrow}>Game {code}</p>
        <h1 className={h1}>Pick a team to join</h1>
        <p>Joining happens on the front door, where you choose a team and an alias.</p>
        <button data-testid="button-go-join" className="btn-big" onClick={() => nav("/")}>Go to join screen</button>
      </div>
    </div>
  );
  return <RoomInner code={code} playerId={session.playerId} onLeave={() => { clearSession(); nav("/"); }} />;
}

function RoomInner({ code, playerId, onLeave }: { code: string; playerId: string; onLeave: () => void }) {
  const conn = useRoomSocket(code, playerId);
  const key = getGetTournamentQueryKey(code, { playerId });
  const q = useGetTournament(code, { playerId }, { query: { queryKey: key, refetchInterval: conn === "live" ? 5000 : 2000, retry: 1 } });
  const v = q.data;
  if (q.isLoading) return <div className="min-h-[100dvh] stage-bg p-6 max-w-xl mx-auto space-y-4 pt-20">{[0, 1, 2].map((i) => <div key={i} className="h-28 rounded-2xl bg-card animate-pulse" />)}</div>;
  if (!v) return (
    <div className="min-h-[100dvh] stage-bg grid place-items-center p-6 text-center"><div className="space-y-4 max-w-sm">
      <h1 className={h1}>Game unavailable</h1><p>We could not load game {code}.</p>
      <button data-testid="button-retry" className="btn-big" onClick={() => q.refetch()}>Retry</button>
      <button data-testid="button-leave" className="underline font-bold" onClick={onLeave}>Leave</button></div></div>
  );
  return <Game v={v} conn={conn} playerId={playerId} onLeave={onLeave} />;
}

function Game({ v, conn, playerId, onLeave }: { v: TournamentView; conn: ConnState; playerId: string; onLeave: () => void }) {
  const qc = useQueryClient();
  const key = getGetTournamentQueryKey(v.code, { playerId });
  const [err, setErr] = useState("");
  const [recall, setRecall] = useState<null | "brief" | "roster" | number>(null);
  const isHost = v.hostId === playerId;
  const myTeam = v.teams.find((t) => t.id === v.me.teamId);
  const opts: Opts = { onSuccess: (nv) => { setErr(""); qc.setQueryData(key, nv); }, onError: (e) => setErr(errMsg(e)) };
  const call: Call = { code: v.code, data: { playerId } };

  const advance = useAdvanceTournamentScreen();
  const reqClue = useRequestTournamentClue();
  const beginVote = useBeginTournamentVote();
  const nextRound = useNextTournamentRound();
  const reset = useResetTournament();
  const ballot = useCastTournamentBallot();

  const ts = v.teamState;
  const screen = ts?.screen;
  const stageKey = [v.status, v.revealStage ?? "", v.roundIndex, v.case?.id ?? "", screen ?? ""].join("|");
  useEffect(() => { setRecall(null); }, [stageKey]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [stageKey, recall]);

  const inRound = v.status === "round" && !!v.case && !!ts;
  const clueNo = screen === "clue1" ? 1 : screen === "clue2" ? 2 : screen === "clue3" ? 3 : 0;
  const lastRecallClue = clueNo ? clueNo - 1 : screen === "extra" ? (ts?.clues.length ?? 1) - 1 : ts?.clues.length ?? 0;
  const canRecall = inRound;
  const hostWait = <p data-testid="text-waiting-host" className="pop bg-secondary p-4 flex items-center gap-3 font-bold"><Hourglass className="h-6 w-6 shrink-0" />Waiting for the host to continue.</p>;
  const hostBtn = (label: string, testid = "button-next") => isHost
    ? <button data-testid={testid} disabled={advance.isPending} onClick={() => advance.mutate(call, opts)} className="btn-big">{label}<ArrowRight className="h-6 w-6" /></button>
    : hostWait;

  const clueCard = (n: number) => (
    <Stage eyebrow={`Clue ${n}`} title="">
      <blockquote data-testid={"text-clue-" + n} className="pop bg-secondary p-6 sm:p-8 font-display text-3xl sm:text-5xl font-extrabold leading-tight -rotate-1">{ts!.clues[n - 1]}</blockquote>
    </Stage>
  );

  let body: ReactNode;
  if (v.status === "lobby") body = <Lobby v={v} isHost={isHost} opts={opts} call={call} playerId={playerId} />;
  else if (v.status === "finished" || (v.status === "reveal" && v.revealStage === "champions")) body = <Champions v={v} isHost={isHost} reset={reset} opts={opts} call={call} />;
  else if (v.status === "reveal" && v.reveal) {
    const final = v.roundIndex + 1 >= v.settings.casesPerTournament;
    body = v.revealStage === "results"
      ? <Results v={v} isHost={isHost} final={final} advance={advance} next={nextRound} opts={opts} call={call} />
      : <CulpritReveal v={v} action={hostBtn("Show team results", "button-show-results")} />;
  } else if (inRound) {
    const c = v.case!;
    if (recall !== null) {
      body = (
        <>
          {recall === "brief" ? <Brief c={c} /> : recall === "roster" ? <Roster c={c} /> : clueCard(recall)}
          <button data-testid="button-recall-close" onClick={() => setRecall(null)} className="btn-big btn-ghost"><ArrowLeft className="h-6 w-6" />Back to the game</button>
        </>
      );
    } else if (screen === "brief") body = <><Brief c={c} />{hostBtn("Meet the team members")}</>;
    else if (screen === "roster") body = <><Roster c={c} />{hostBtn("Show clue 1")}</>;
    else if (clueNo) body = <>{clueCard(clueNo)}{hostBtn(clueNo === 3 ? "Time to decide" : `Show clue ${clueNo + 1}`)}</>;
    else if (screen === "extra") body = (
      <>
        <Stage eyebrow="Private extra clue: only your team sees this" title="">
          <blockquote data-testid={"text-clue-" + ts!.clues.length} className="pop bg-card p-6 sm:p-8 font-display text-3xl sm:text-4xl font-extrabold leading-tight border-dashed">{ts!.clues[ts!.clues.length - 1]}</blockquote>
        </Stage>
        <button data-testid="button-next" disabled={advance.isPending} onClick={() => advance.mutate(call, opts)} className="btn-big btn-teal"><ArrowLeft className="h-6 w-6" />Done, back to decision</button>
        {isHost && <VoteOpen beginVote={beginVote} opts={opts} call={call} host />}
      </>
    );
    else if (screen === "choice") {
      const used = Math.max(0, ts!.clues.length - 3);
      const canMore = used < 7;
      body = (
        <Stage eyebrow="Team decision" title="Ready to point fingers?">
          <p className="text-lg">Worth <b data-testid="text-value">{ts!.value}</b> points right now. Talk it over with your team.</p>
          <div className="grid gap-4">
            <button data-testid="button-request-clue" disabled={!canMore || ts!.ready || reqClue.isPending} onClick={() => reqClue.mutate(call, opts)} className="btn-big btn-alt">
              <Search className="h-6 w-6" />{canMore ? `Get a private extra clue (-10 points)` : "No more extra clues"}</button>
            {isHost ? <VoteOpen beginVote={beginVote} opts={opts} call={call} host />
              : ts!.ready ? <p data-testid="text-team-ready" className="pop bg-secondary p-4 font-bold flex items-center gap-3"><ThumbsUp className="h-6 w-6" />Your team is marked ready. Waiting for the host to open the ballots.</p>
              : <VoteOpen beginVote={beginVote} opts={opts} call={call} host={false} />}
          </div>
          {isHost && <div className="pop bg-card p-4" data-testid="list-team-readiness"><p className="font-bold mb-2">Team decisions</p>{v.teams.map(t => <p key={t.id} className="text-sm">{t.name}: {t.ready ? "Ready to accuse" : "Discussing clues"}</p>)}</div>}
        </Stage>
      );
    } else if (screen === "vote" || screen === "runoff") body = <VoteScreen v={v} runoff={screen === "runoff"} ballot={ballot} opts={opts} playerId={playerId} />;
    else body = (
      <Stage eyebrow="Your team's votes are in" title={v.teams.every(t => t.ballotComplete) ? "Ready for the reveal" : "Waiting for the other teams"}>
        <p className="text-lg">{v.teams.every(t => t.ballotComplete) ? "Every team has finished its ballot. The host reveals the culprit next." : "Your team is finished. Other teams are still voting."}</p>
        <Tallies v={v} />
        {isHost ? <button data-testid="button-reveal" disabled={!v.teams.every(t => t.ballotComplete) || advance.isPending} onClick={() => advance.mutate(call, opts)} className="btn-big">Reveal the culprit<ArrowRight className="h-6 w-6" /></button> : hostWait}
      </Stage>
    );
  } else body = <Stage eyebrow="Hang on" title="Loading the next screen"><div className="h-24 rounded-2xl bg-card animate-pulse" /></Stage>;

  const showRecall = canRecall && recall === null;
  const pill = "px-3 min-h-10 rounded-full border-2 border-foreground bg-card font-bold text-sm flex items-center gap-1.5 hover:bg-secondary";
  return (
    <div className="min-h-[100dvh] stage-bg">
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b-2 border-foreground">
        <div className="max-w-3xl mx-auto px-3 py-2 flex items-center gap-2">
          <button data-testid="button-leave" onClick={onLeave} aria-label="Leave game" className="p-2.5 rounded-lg hover:bg-secondary"><LogOut className="h-5 w-5" /></button>
          <span className="font-mono font-bold tracking-widest" data-testid="text-code-top">{v.code}</span>
          <span className="flex-1" />
          {myTeam && <span className="flex items-center gap-1.5 text-sm font-bold min-w-0" data-testid="text-my-team"><span className="h-3 w-3 rounded-full border-2 border-foreground shrink-0" style={{ background: teamColor(myTeam.id) }} /><span className="truncate max-w-[9rem]">{myTeam.name}</span></span>}
          {v.status !== "lobby" && myTeam && <span className="font-mono font-bold bg-foreground text-card rounded-md px-2 py-0.5" data-testid="text-my-score">{myTeam.score}</span>}
          <span data-testid="status-connection" aria-label={conn} className={conn === "offline" ? "text-destructive" : ""}>{conn === "offline" ? <WifiOff className="h-5 w-5" /> : <Wifi className="h-5 w-5" />}</span>
        </div>
        {inRound && <div className="max-w-3xl mx-auto px-4 pb-2 flex justify-between font-mono text-[11px] uppercase tracking-widest"><span data-testid="text-round">Case {v.roundIndex + 1} of {v.settings.casesPerTournament}</span><span data-testid="text-difficulty">{v.case!.difficulty}</span><span data-testid="text-value-top">Worth {ts!.value}</span></div>}
      </header>
      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-10 pb-16">
        {err && <div role="alert" data-testid="text-error" className="mb-4 pop bg-destructive text-destructive-foreground px-4 py-3 flex justify-between gap-3"><span className="font-bold">{err}</span><button aria-label="Dismiss" onClick={() => setErr("")}><X className="h-5 w-5" /></button></div>}
        <div key={stageKey + "|" + String(recall)} className="screen-in space-y-6">{body}</div>
        {showRecall && (
          <div className="mt-10 pt-4 border-t-2 border-dashed border-foreground/40">
            <p className="font-mono text-xs uppercase tracking-widest mb-2 flex items-center gap-1.5"><Eye className="h-4 w-4" />Look back</p>
            <div className="flex flex-wrap gap-2">
              {screen !== "brief" && <button data-testid="button-recall-brief" className={pill} onClick={() => setRecall("brief")}>The case</button>}
              {screen !== "brief" && screen !== "roster" && <button data-testid="button-recall-roster" className={pill} onClick={() => setRecall("roster")}>Team members</button>}
              {Array.from({ length: lastRecallClue }, (_, i) => i + 1).map((n) => <button key={n} data-testid={"button-recall-clue-" + n} className={pill} onClick={() => setRecall(n)}>Clue {n}</button>)}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function VoteOpen({ beginVote, opts, call, host }: { beginVote: ReturnType<typeof useBeginTournamentVote>; opts: Opts; call: Call; host: boolean }) {
  return (
    <div className="space-y-2">
      <button data-testid="button-begin-vote" disabled={beginVote.isPending} onClick={() => beginVote.mutate(call, opts)} className="btn-big">
        {host ? <Gavel className="h-6 w-6" /> : <ThumbsUp className="h-6 w-6" />}{host ? "Open voting for everyone" : "Our team is ready to vote"}</button>
      <p className="text-sm text-muted-foreground">{host ? "This opens ballots for every team at once, even teams still reading extra clues." : "This tells the host your team is ready. Only the host can open the ballots."}</p>
    </div>
  );
}

function Stage({ eyebrow: e, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return <section className="space-y-5"><p className={eyebrow}>{e}</p>{title && <h1 className={h1}>{title}</h1>}{children}</section>;
}

function Brief({ c }: { c: Case }) {
  return (
    <Stage eyebrow={`The case / ${c.difficulty}`} title={c.title}>
      <p data-testid="text-brief" className="pop p-5 sm:p-6 text-xl sm:text-2xl leading-relaxed">{c.brief}</p>
    </Stage>
  );
}

function Roster({ c }: { c: Case }) {
  return (
    <Stage eyebrow="Team Members" title="Meet the usual suspects">
      <div className="grid sm:grid-cols-2 gap-4">
        {c.characters.map((ch, i) => (
          <article key={ch.name} data-testid={"card-character-" + ch.name} className="pop overflow-hidden" style={{ transform: `rotate(${i % 2 ? .7 : -.7}deg)` }}>
            <Portrait src={ch.portrait} name={ch.name} className="w-full aspect-[4/3] text-6xl border-b-2 border-foreground" />
            <div className="p-4"><h3 className="font-display text-2xl font-extrabold">{ch.name}</h3><p className="text-primary font-bold text-sm">{ch.title}</p><p className="mt-1">{ch.personality}</p></div>
          </article>
        ))}
      </div>
    </Stage>
  );
}

function Tallies({ v }: { v: TournamentView }) {
  const t = v.teamState;
  if (!t || t.tallies.length === 0) return null;
  return (
    <div className="space-y-3" data-testid="list-tallies">
      {t.tallies.map((x) => (
        <div key={x.suspect}><div className="flex justify-between text-lg font-bold"><span>{x.suspect}</span><span className="font-mono">{Math.round(x.percent)}%</span></div>
          <div className="h-4 rounded-full bg-card border-2 border-foreground overflow-hidden"><div className="h-full bg-primary origin-left transition-transform duration-500" style={{ transform: `scaleX(${Math.min(1, x.percent / 100)})` }} /></div></div>
      ))}
    </div>
  );
}

function VoteScreen({ v, runoff, ballot, opts, playerId }: { v: TournamentView; runoff: boolean; ballot: ReturnType<typeof useCastTournamentBallot>; opts: Opts; playerId: string }) {
  const ts = v.teamState!;
  const left = useCountdown(ts.deadline);
  const total = runoff ? 30 : v.settings.votingSeconds;
  const chars = v.case!.characters;
  const names = runoff && ts.runoffOptions.length ? ts.runoffOptions : chars.map((c) => c.name);
  return (
    <Stage eyebrow={runoff ? "Runoff: tied suspects only" : "Voting is open"} title={ts.hasVoted ? "You already voted." : "Who did it?"}>
      <div className="flex items-center gap-3"><Clock className="h-6 w-6" />
        <div className="flex-1 h-4 rounded-full bg-card border-2 border-foreground overflow-hidden"><div className="h-full bg-accent origin-left transition-transform duration-300 ease-linear" style={{ transform: `scaleX(${left === null ? 1 : Math.min(1, left / total)})` }} /></div>
        <span data-testid="text-timer" className="font-mono text-2xl font-bold w-12 text-right">{left ?? "--"}</span></div>
      <div className="grid grid-cols-2 gap-3">
        {names.map((n) => {
          const ch = chars.find((c) => c.name === n); const mine = ts.choice === n;
          return (
            <button key={n} data-testid={"button-suspect-" + n} aria-pressed={mine} disabled={ts.hasVoted || ballot.isPending || left === 0}
              onClick={() => ballot.mutate({ code: v.code, data: { playerId, suspect: n } }, opts)}
              className={"pop text-left overflow-hidden transition active:translate-y-1 disabled:cursor-not-allowed " + (mine ? "bg-secondary -rotate-1" : "hover:-translate-y-0.5 disabled:opacity-60")}>
              {ch && <Portrait src={ch.portrait} name={n} className="w-full aspect-square text-5xl border-b-2 border-foreground" />}
              <div className="p-3 flex items-center justify-between gap-2"><span className="font-display font-extrabold leading-tight">{n}</span>{mine && <Check className="h-6 w-6 shrink-0" />}</div>
            </button>
          );
        })}
      </div>
      <p className="text-sm" data-testid="text-votes-in"><Users className="inline h-4 w-4 mr-1" />{ts.submittedVotes} votes in. Votes are final.{runoff && " If this runoff also ties, a draw between the leaders decides."}</p>
      <Tallies v={v} />
    </Stage>
  );
}

function errBox(e: string) { return e ? <p role="alert" data-testid="text-team-error" className="font-bold text-destructive">{e}</p> : null; }

function TeamRow({ t, v, isHost, playerId, manage, count }: { t: TournamentView["teams"][number]; v: TournamentView; isHost: boolean; playerId: string; manage: ReturnType<typeof useManageTournamentTeam>; count: number }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(t.name);
  const [e, setE] = useState("");
  const members = v.players.filter((p) => p.teamId === t.id);
  const ok = t.playerCount >= 1 && t.playerCount <= 10;
  const run = (data: { action: "rename" | "remove"; name?: string }, done?: () => void) => {
    setE("");
    manage.mutate({ code: v.code, data: { playerId, teamId: t.id, ...data } }, { onSuccess: () => done?.(), onError: (x) => setE(errMsg(x)) });
  };
  const trimmed = name.trim();
  return (
    <section data-testid={"card-team-" + t.id} className="pop p-4" style={{ background: `color-mix(in srgb, ${teamColor(t.id)} 14%, hsl(var(--card)))` }}>
      <div className="flex justify-between items-start gap-2">
        {editing ? (
          <form className="flex-1 flex gap-2" onSubmit={(ev) => { ev.preventDefault(); if (trimmed) run({ action: "rename", name: trimmed }, () => setEditing(false)); }}>
            <input data-testid={"input-team-name-" + t.id} aria-label="Team name" autoFocus maxLength={30} value={name} onChange={(x) => setName(x.target.value)} className="field py-2 min-w-0" />
            <button data-testid={"button-save-team-" + t.id} disabled={!trimmed || manage.isPending} className="px-3 rounded-xl border-2 border-foreground bg-primary text-primary-foreground" aria-label="Save name"><Check className="h-5 w-5" /></button>
            <button type="button" onClick={() => { setEditing(false); setName(t.name); setE(""); }} className="px-3 rounded-xl border-2 border-foreground bg-card" aria-label="Cancel"><X className="h-5 w-5" /></button>
          </form>
        ) : <h3 className="font-display text-2xl font-extrabold break-words min-w-0" style={{ color: teamColor(t.id) }}>{t.name}</h3>}
        {isHost && !editing && (
          <div className="flex gap-1 shrink-0">
            <button data-testid={"button-rename-team-" + t.id} aria-label={"Rename " + t.name} onClick={() => { setName(t.name); setEditing(true); }} className="p-2.5 rounded-lg border-2 border-foreground bg-card"><Pencil className="h-4 w-4" /></button>
            <button data-testid={"button-remove-team-" + t.id} aria-label={"Remove " + t.name} disabled={count <= 1 || t.playerCount > 0 || manage.isPending} onClick={() => run({ action: "remove" })} className="p-2.5 rounded-lg border-2 border-foreground bg-card disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
          </div>
        )}
      </div>
      <div className="font-mono text-sm mt-1">{t.playerCount} / 10 / {ok ? "Ready" : "Needs a player"}</div>
      {errBox(e)}
      <div className="flex flex-wrap gap-2 mt-3">{members.length === 0 && <span className="text-sm text-muted-foreground">Nobody yet</span>}
        {members.map((p) => <span key={p.id} data-testid={"row-player-" + p.id} className={"px-3 py-1.5 rounded-full bg-card border-2 border-foreground text-sm font-bold flex items-center gap-1.5 " + (p.connected ? "" : "opacity-50")}>{p.isHost && <Crown className="h-3.5 w-3.5" />}{p.displayName}{p.id === playerId && " (you)"}</span>)}</div>
    </section>
  );
}

function Lobby({ v, isHost, opts, call, playerId }: { v: TournamentView; isHost: boolean; opts: Opts; call: Call; playerId: string }) {
  const [copied, setCopied] = useState(false);
  const [e, setE] = useState("");
  const settings = useSetTournamentSettings();
  const start = useStartTournament();
  const manage = useManageTournamentTeam();
  const s = v.settings;
  const ready = v.teams.length >= 1 && v.teams.every((t) => t.playerCount >= 1 && t.playerCount <= 10);
  const set = (p: Partial<typeof s>) => settings.mutate({ code: v.code, data: { playerId, teamCount: s.teamCount, casesPerTournament: (p.casesPerTournament ?? s.casesPerTournament) as 1 | 3 | 5 | 7 | 10, votingSeconds: p.votingSeconds ?? s.votingSeconds } }, opts);
  const label = "font-mono text-xs uppercase tracking-widest mb-2";
  return (
    <>
      <Stage eyebrow="Lobby" title="Gather the teams">
        <div className="flex items-center gap-3 flex-wrap">
          <span data-testid="text-room-code" className="font-mono text-4xl sm:text-5xl tracking-[0.3em] pop bg-secondary px-5 py-3 -rotate-1">{v.code}</span>
          <button data-testid="button-copy" aria-label="Copy code" onClick={() => { navigator.clipboard?.writeText(v.code); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="p-3.5 pop">{copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}</button>
        </div>
      </Stage>
      <div className="space-y-4">
        {v.teams.map((t) => <TeamRow key={t.id} t={t} v={v} isHost={isHost} playerId={playerId} manage={manage} count={v.teams.length} />)}
        {isHost && <>
          <button data-testid="button-add-team" disabled={v.teams.length >= 5 || manage.isPending} onClick={() => { setE(""); manage.mutate({ code: v.code, data: { playerId, action: "add" } }, { onError: (x) => setE(errMsg(x)) }); }} className="btn-big btn-ghost border-dashed"><Plus className="h-6 w-6" />Add a team</button>
          {errBox(e)}
        </>}
      </div>
      {isHost ? (
        <section className="pop p-5 space-y-5" data-testid="panel-host-setup">
          <div><p className={label}>How many cases</p><div className="flex gap-2 flex-wrap">{[1, 3, 5, 7, 10].map((n) => <button key={n} data-testid={"button-cases-" + n} aria-pressed={s.casesPerTournament === n} onClick={() => set({ casesPerTournament: n })} className="chip">{n}</button>)}</div></div>
          <div><p className={label}>Voting seconds</p><div className="flex gap-2 flex-wrap">{[30, 45, 60, 90, 120].map((n) => <button key={n} data-testid={"button-seconds-" + n} aria-pressed={s.votingSeconds === n} onClick={() => set({ votingSeconds: n })} className="chip">{n}</button>)}</div></div>
          <button data-testid="button-start" disabled={!ready || start.isPending} onClick={() => start.mutate(call, opts)} className="btn-big">{start.isPending ? "Starting..." : "Start the game"}<ArrowRight className="h-6 w-6" /></button>
          {!ready && <p className="text-sm">Every team needs at least 1 player. Remove empty teams or wait for people to join.</p>}
          {settings.isError && <p className="text-sm font-bold text-destructive">{errMsg(settings.error, "Could not save settings.")}</p>}
        </section>
      ) : (
        <p className="pop bg-secondary p-4 font-bold text-center" data-testid="text-waiting-host">{s.casesPerTournament} cases, {s.votingSeconds}s votes. Waiting for the host to start.</p>
      )}
    </>
  );
}

function CulpritReveal({ v, action }: { v: TournamentView; action: ReactNode }) {
  const r = v.reveal!;
  return (
    <>
      <Stage eyebrow="The culprit was" title="">
        <div className="pop stamp bg-primary text-primary-foreground p-6 sm:p-10"><p data-testid="text-culprit" className="font-display text-5xl sm:text-7xl font-extrabold break-words">{r.culprit}</p></div>
        <div className="space-y-3 text-lg"><p data-testid="text-what"><b className="text-primary">What happened.</b> {r.what}</p><p data-testid="text-why"><b className="text-primary">Why.</b> {r.why}</p></div>
      </Stage>
      {action}
    </>
  );
}

function Leaderboard({ v }: { v: TournamentView }) {
  const sorted = [...v.teams].sort((a, b) => b.score - a.score);
  const max = Math.max(1, ...sorted.map((t) => t.score));
  return (
    <div className="space-y-3" data-testid="list-leaderboard">
      {sorted.map((t) => (
        <div key={t.id} data-testid={"row-rank-" + t.id} className="pop p-3 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 w-full opacity-30 origin-left transition-transform duration-700" style={{ transform: `scaleX(${t.score / max})`, background: teamColor(t.id) }} />
          <div className="relative flex items-center gap-3"><span className="font-display text-2xl font-extrabold w-8 text-center">{sorted[0]!.score === t.score ? <Medal className="h-7 w-7 mx-auto" /> : sorted.findIndex((o) => o.score === t.score) + 1}</span><span className="flex-1 min-w-0 font-bold text-lg break-words">{t.name}</span><span className="font-mono text-2xl font-bold">{t.score}</span></div>
        </div>
      ))}
    </div>
  );
}

function Results({ v, isHost, final, advance, next, opts, call }: { v: TournamentView; isHost: boolean; final: boolean; advance: ReturnType<typeof useAdvanceTournamentScreen>; next: ReturnType<typeof useNextTournamentRound>; opts: Opts; call: Call }) {
  const r = v.reveal!;
  return (
    <>
      <Stage eyebrow={`Culprit: ${r.culprit}`} title="Who got it?">
        <div className="space-y-3">{r.results.map((x) => (
          <div key={x.teamId} data-testid={"row-result-" + x.teamId} className="pop p-3 flex items-center gap-3">
            <span className={"h-11 w-11 rounded-full border-2 border-foreground grid place-items-center shrink-0 " + (x.correct ? "bg-accent text-accent-foreground" : "bg-muted")}>{x.correct ? <Check className="h-6 w-6" /> : <X className="h-6 w-6" />}</span>
            <div className="flex-1 min-w-0"><div className="font-bold break-words">{x.teamName}</div><div className="text-sm text-muted-foreground">{x.suspect ?? "No vote"} / {x.extraClues} extra clue{x.extraClues === 1 ? "" : "s"}</div></div>
            <span className="font-mono text-xl font-bold">+{x.points}</span></div>))}</div>
      </Stage>
      <div><p className={eyebrow + " mb-3"}>Leaderboard</p><Leaderboard v={v} /></div>
      {!isHost ? <p className="pop bg-secondary p-4 font-bold flex items-center gap-3" data-testid="text-waiting-host"><Hourglass className="h-6 w-6 shrink-0" />Waiting for the host to continue.</p>
        : final ? <button data-testid="button-show-champions" disabled={advance.isPending} onClick={() => advance.mutate(call, opts)} className="btn-big">Crown the champions<Trophy className="h-6 w-6" /></button>
        : <button data-testid="button-next-round" disabled={next.isPending} onClick={() => next.mutate(call, opts)} className="btn-big">Next case<ArrowRight className="h-6 w-6" /></button>}
    </>
  );
}

function Champions({ v, isHost, reset, opts, call }: { v: TournamentView; isHost: boolean; reset: ReturnType<typeof useResetTournament>; opts: Opts; call: Call }) {
  const [, nav] = useLocation();
  return (
    <>
      <Confetti />
      <Stage eyebrow="Office champions" title="">
        <div className="pop stamp bg-secondary p-8 text-center">
          <Trophy className="h-16 w-16 mx-auto" />
          <p data-testid="text-champion" className="font-display text-3xl sm:text-7xl font-extrabold mt-3 break-words">{v.winners.join(" & ") || "No winner"}</p>
        </div>
      </Stage>
      <div><p className={eyebrow + " mb-3"}>Final rankings</p><Leaderboard v={v} /></div>
      {v.awards.length > 0 && <div><p className={eyebrow + " mb-3"}>Awards</p>
        <div className="grid sm:grid-cols-2 gap-3">{v.awards.map((a, i) => (
          <div key={a.name} data-testid={"card-award-" + a.name} className="pop min-w-0 p-4 break-words" style={{ transform: `rotate(${i % 2 ? .8 : -.8}deg)` }}><Flag className="h-5 w-5 text-primary" /><div className="font-display text-xl font-extrabold mt-1">{a.name}</div><div>{a.teamNames.join(", ") || "Nobody this time"}</div><div className="font-mono text-sm text-primary">
            {a.name === "Clue Hoarders" ? `${a.value + 3 * v.settings.casesPerTournament} clues used`
              : a.name === "Bold Detectives" ? (a.teamNames.length ? `${a.value + 3} clues in a correct solve` : "No correct solves")
              : a.name === "Prince Blamers" ? `${a.value} votes for Prince`
              : `${a.value} cases solved`}
          </div></div>))}</div></div>}
      {isHost ? <button data-testid="button-new-tournament" disabled={reset.isPending} onClick={() => reset.mutate(call, opts)} className="btn-big"><RotateCcw className="h-6 w-6" />Play again</button>
        : <p className="pop bg-secondary p-4 font-bold text-center" data-testid="text-waiting-host">The host can start a new game.</p>}
      <button data-testid="button-home" onClick={() => { clearSession(); nav("/"); }} className="w-full font-bold py-3 flex items-center justify-center gap-2 underline"><Home className="h-4 w-4" />Leave game</button>
    </>
  );
}

