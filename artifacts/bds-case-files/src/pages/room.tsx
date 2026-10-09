import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetTournament, getGetTournamentQueryKey, useSetTournamentSettings, useStartTournament, useAdvanceTournamentScreen,
  useRequestTournamentClue, useBeginTournamentVote, useNextTournamentRound, useResetTournament, useCastTournamentBallot,
  type TournamentView,
} from "@workspace/api-client-react";
import { useRoomSocket, type ConnState } from "@/hooks/use-room-socket";
import { loadSession, clearSession } from "@/lib/session";
import { Portrait, Confetti, teamColor, useCountdown } from "@/components/tournament-bits";
import { Briefcase, IdCard, Pin, Wifi, WifiOff, Crown, Copy, Check, ArrowRight, Vote, Search, Trophy, Clock, X, Medal, Home, Users, RotateCcw, LogOut } from "lucide-react";

const bigBtn = "w-full bg-primary text-primary-foreground font-bold text-xl py-5 rounded-2xl hover:brightness-110 active:scale-[.98] transition disabled:opacity-40 flex items-center justify-center gap-2";
const eyebrow = "font-mono text-xs uppercase tracking-[0.3em] text-primary";

export default function Room() {
  const params = useParams<{ code: string }>();
  const code = (params.code || "").toUpperCase();
  const [, nav] = useLocation();
  const s = loadSession();
  const session = s && s.code === code ? s : null;
  if (!session) return (
    <div className="min-h-[100dvh] stage-bg grid place-items-center p-6 text-center">
      <div className="screen-in max-w-sm space-y-4">
        <p className={eyebrow}>Tournament {code}</p>
        <h1 className="font-display text-4xl font-bold">Pick a team to join</h1>
        <p className="text-muted-foreground">Joining happens on the front door, where you choose a team and an alias.</p>
        <button data-testid="button-go-join" className={bigBtn} onClick={() => nav("/")}>Go to join screen</button>
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
      <h1 className="font-display text-3xl font-bold">Game unavailable</h1><p className="text-muted-foreground">We could not load tournament {code}.</p>
      <button data-testid="button-retry" className={bigBtn} onClick={() => q.refetch()}>Retry</button>
      <button data-testid="button-leave" className="text-muted-foreground underline" onClick={onLeave}>Leave</button></div></div>
  );
  return <Game v={v} conn={conn} playerId={playerId} onLeave={onLeave} />;
}

function Game({ v, conn, playerId, onLeave }: { v: TournamentView; conn: ConnState; playerId: string; onLeave: () => void }) {
  const qc = useQueryClient();
  const key = getGetTournamentQueryKey(v.code, { playerId });
  const apply = (nv: TournamentView) => qc.setQueryData(key, nv);
  const [err, setErr] = useState("");
  const [recall, setRecall] = useState<null | "brief" | "roster" | number>(null);
  const [showChampions, setShowChampions] = useState(false);
  const isHost = v.hostId === playerId;
  const myTeam = v.teams.find((t) => t.id === v.me.teamId);
  const opts = { onSuccess: (nv: TournamentView) => { setErr(""); setRecall(null); apply(nv); }, onError: () => setErr("That did not go through. Try again.") };
  const call = { code: v.code, data: { playerId } };

  const settings = useSetTournamentSettings();
  const start = useStartTournament();
  const advance = useAdvanceTournamentScreen();
  const reqClue = useRequestTournamentClue();
  const beginVote = useBeginTournamentVote();
  const nextRound = useNextTournamentRound();
  const reset = useResetTournament();
  const ballot = useCastTournamentBallot();

  const ts = v.teamState;
  useEffect(() => { setRecall(null); setShowChampions(false); }, [v.case?.id, v.status]);
  const inRound = v.status === "round" && v.case && ts;
  const screen = ts?.screen;
  const clueNo = screen === "clue1" ? 1 : screen === "clue2" ? 2 : screen === "clue3" ? 3 : 0;
  const reached = (n: "brief" | "roster" | number) => {
    if (!screen) return false;
    const order = ["brief", "roster", "clue1", "clue2", "clue3"];
    const idx = typeof n === "number" ? order.indexOf("clue" + Math.min(n, 3)) : order.indexOf(n);
    if (typeof n === "number" && n > 3) return (ts?.clues.length ?? 0) >= n;
    const cur = order.indexOf(screen);
    return cur === -1 || cur > idx;
  };
  const recallable = (n: "brief" | "roster" | number) => reached(n) && !(typeof n === "number" && n > (ts?.clues.length ?? 0));

  const Top = (
    <header className="sticky top-0 z-20 bg-background/85 backdrop-blur border-b border-border">
      <div className="max-w-3xl mx-auto px-3 py-2.5 flex items-center gap-2">
        <button data-testid="button-leave" onClick={onLeave} aria-label="Leave" className="p-2 rounded-lg text-muted-foreground hover:text-foreground"><LogOut className="h-5 w-5" /></button>
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto">
          {inRound && <>
            {([["brief", Briefcase], ["roster", IdCard]] as const).map(([id, Icon]) => (
              <button key={id} data-testid={"button-recall-" + id} disabled={!recallable(id)} onClick={() => setRecall(recall === id ? null : id)}
                className={"p-2.5 rounded-xl border transition disabled:opacity-30 " + (recall === id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary")}><Icon className="h-5 w-5" /></button>
            ))}
            {Array.from({ length: Math.max(ts!.clues.length, 0) }, (_, i) => i + 1).map((n) => (
              <button key={n} data-testid={"button-recall-clue-" + n} onClick={() => setRecall(recall === n ? null : n)}
                className={"px-2.5 py-2 rounded-xl border flex items-center gap-1 font-mono text-sm transition " + (recall === n ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary")}><Pin className="h-4 w-4" />{n}</button>
            ))}
          </>}
          {!inRound && <span className="font-display font-bold px-2" data-testid="text-code-top">{v.code}</span>}
        </div>
        {myTeam && <span className="hidden sm:flex items-center gap-1.5 text-sm font-semibold" data-testid="text-my-team"><span className="h-2.5 w-2.5 rounded-full" style={{ background: teamColor(myTeam.id) }} />{myTeam.name}</span>}
        {v.status !== "lobby" && myTeam && <span className="font-mono text-sm text-primary" data-testid="text-my-score">{myTeam.score}</span>}
        <span data-testid="status-connection" className={conn === "offline" ? "text-destructive" : conn === "live" ? "text-primary" : "text-muted-foreground"}>{conn === "offline" ? <WifiOff className="h-4 w-4" /> : <Wifi className="h-4 w-4" />}</span>
      </div>
      {inRound && <div className="max-w-3xl mx-auto px-4 pb-2 flex justify-between font-mono text-[11px] uppercase tracking-widest text-muted-foreground"><span data-testid="text-round">Case {v.roundIndex + 1} of {v.settings.casesPerTournament}</span><span data-testid="text-difficulty">{v.case!.difficulty}</span><span data-testid="text-value">Worth {ts!.value}</span></div>}
    </header>
  );

  let body: ReactNode = null;
  let bodyKey: string = v.status;

  if (v.status === "lobby") {
    bodyKey = "lobby";
    body = <Lobby v={v} isHost={isHost} settings={settings} start={start} apply={opts} call={call} playerId={playerId} />;
  } else if (v.status === "finished") {
    bodyKey = showChampions ? "champions" : "final-reveal";
    body = showChampions
      ? <Finished v={v} isHost={isHost} reset={reset} opts={opts} call={call} onReview={() => setShowChampions(false)} />
      : <Reveal v={v} isHost={isHost} next={nextRound} opts={opts} call={call} onShowChampions={() => setShowChampions(true)} />;
  } else if (v.status === "reveal" && v.reveal) {
    body = <Reveal v={v} isHost={isHost} next={nextRound} opts={opts} call={call} />;
  } else if (inRound) {
    const c = v.case!;
    const shownKey = recall !== null ? "r" + recall : screen!;
    bodyKey = shownKey;
    const advBtn = (label: string) => (
      <button data-testid="button-next" disabled={advance.isPending} onClick={() => advance.mutate(call, opts)} className={bigBtn}>{label}<ArrowRight className="h-6 w-6" /></button>
    );
    const ClueView = ({ n }: { n: number }) => (
      <Stage eyebrow={`Clue ${n}`} title="">
        <blockquote data-testid={"text-clue-" + n} className="font-display text-3xl sm:text-5xl font-bold leading-tight border-l-4 border-primary pl-5">{ts!.clues[n - 1]}</blockquote>
      </Stage>
    );
    if (recall === "brief") body = <BriefView c={c} />;
    else if (recall === "roster") body = <Roster c={c} />;
    else if (typeof recall === "number") body = <ClueView n={recall} />;
    else if (screen === "brief") body = <><BriefView c={c} />{advBtn("Meet the suspects")}</>;
    else if (screen === "roster") body = <><Roster c={c} />{advBtn("See clue 1")}</>;
    else if (clueNo) body = <><ClueView n={clueNo} />{advBtn(clueNo === 3 ? "Continue" : "Next")}</>;
    else if (screen === "extra") body = <><ClueView n={ts!.clues.length} />{advBtn("Continue")}</>;
    else if (screen === "choice") {
      const canMore = ts!.clues.length < 10;
      body = (
        <Stage eyebrow="Team decision" title="What would your team like to do?">
          <div className="grid gap-3">
            <button data-testid="button-begin-vote" disabled={beginVote.isPending} onClick={() => beginVote.mutate(call, opts)} className={bigBtn}><Vote className="h-6 w-6" />Make accusation</button>
            <button data-testid="button-request-clue" disabled={!canMore || reqClue.isPending} onClick={() => reqClue.mutate(call, opts)} className="w-full border-2 border-primary text-primary font-bold text-xl py-5 rounded-2xl hover:bg-primary/10 disabled:opacity-40 flex items-center justify-center gap-2">
              <Search className="h-6 w-6" />{canMore ? `Request another clue (case drops to ${ts!.value - 10})` : "No more clues"}</button>
          </div>
        </Stage>
      );
    } else if (screen === "vote" || screen === "runoff") {
      body = <VoteScreen v={v} runoff={screen === "runoff"} ballot={ballot} opts={opts} playerId={playerId} />;
    } else body = (
      <Stage eyebrow="Locked in" title="Waiting for other teams">
        <p className="text-muted-foreground text-lg">Your team has voted. The reveal starts when every team finishes its ballot; each team's timer counts only submitted votes.</p>
        <Tallies v={v} />
      </Stage>
    );
  } else body = <Stage eyebrow="Hang on" title="Loading the next screen"><div className="h-24 rounded-2xl bg-card animate-pulse" /></Stage>;

  return (
    <div className="min-h-[100dvh] stage-bg">
      {Top}
      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-10 pb-16">
        {err && <div data-testid="text-error" className="mb-4 rounded-xl border border-destructive/60 bg-destructive/10 px-4 py-3 flex justify-between"><span>{err}</span><button aria-label="Dismiss" onClick={() => setErr("")}><X className="h-5 w-5" /></button></div>}
        <div key={bodyKey} className="screen-in space-y-6">{body}</div>
      </main>
    </div>
  );
}

function Stage({ eyebrow: e, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return <section className="space-y-5"><p className={eyebrow}>{e}</p>{title && <h1 className="font-display text-4xl sm:text-5xl font-bold leading-tight">{title}</h1>}{children}</section>;
}

function BriefView({ c }: { c: NonNullable<TournamentView["case"]> }) {
  return <Stage eyebrow={`Case brief / ${c.difficulty}`} title={c.title}><p data-testid="text-brief" className="text-xl sm:text-2xl text-muted-foreground leading-relaxed">{c.brief}</p></Stage>;
}

function Roster({ c }: { c: NonNullable<TournamentView["case"]> }) {
  return (
    <Stage eyebrow="The suspects" title="Meet the team">
      <div className="grid sm:grid-cols-2 gap-4">
        {c.characters.map((ch) => (
          <article key={ch.name} data-testid={"card-character-" + ch.name} className="rounded-2xl overflow-hidden border border-border bg-card">
            <Portrait src={ch.portrait} name={ch.name} className="w-full aspect-[4/3] text-6xl" />
            <div className="p-4"><h3 className="font-display text-2xl font-bold">{ch.name}</h3><p className="text-primary text-sm font-semibold">{ch.title}</p><p className="text-muted-foreground mt-1">{ch.personality}</p></div>
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
        <div key={x.suspect}><div className="flex justify-between text-lg font-semibold"><span>{x.suspect}</span><span className="font-mono text-primary">{Math.round(x.percent)}%</span></div>
          <div className="h-3 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-primary origin-left transition-transform duration-500" style={{ transform: `scaleX(${Math.min(1, x.percent / 100)})` }} /></div></div>
      ))}
    </div>
  );
}

function VoteScreen({ v, runoff, ballot, opts, playerId }: { v: TournamentView; runoff: boolean; ballot: ReturnType<typeof useCastTournamentBallot>; opts: { onSuccess: (nv: TournamentView) => void; onError: () => void }; playerId: string }) {
  const ts = v.teamState!;
  const left = useCountdown(ts.deadline);
  const total = runoff ? 30 : v.settings.votingSeconds;
  const names = runoff && ts.runoffOptions.length ? ts.runoffOptions : v.case!.characters.map((c) => c.name);
  const chars = v.case!.characters;
  return (
    <Stage eyebrow={runoff ? "Runoff: tied suspects only" : "Team vote"} title={ts.hasVoted ? "You already voted." : "Who did it?"}>
      <div className="flex items-center gap-3"><Clock className="h-5 w-5 text-primary" />
        <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden"><div className="h-full bg-primary origin-left transition-transform duration-300 ease-linear" style={{ transform: `scaleX(${left === null ? 1 : Math.min(1, left / total)})` }} /></div>
        <span data-testid="text-timer" className="font-mono text-2xl font-bold w-12 text-right">{left ?? "--"}</span></div>
      <div className="grid grid-cols-2 gap-3">
        {names.map((n) => {
          const ch = chars.find((c) => c.name === n); const mine = ts.choice === n;
          return (
            <button key={n} data-testid={"button-suspect-" + n} disabled={ts.hasVoted || ballot.isPending || left === 0}
              onClick={() => ballot.mutate({ code: v.code, data: { playerId, suspect: n } }, opts)}
              className={"text-left rounded-2xl overflow-hidden border-2 transition active:scale-[.97] disabled:cursor-not-allowed " + (mine ? "border-primary bg-primary/15" : "border-border bg-card hover:border-primary/60")}>
              {ch && <Portrait src={ch.portrait} name={n} className="w-full aspect-square text-5xl" />}
              <div className="p-3 flex items-center justify-between gap-2"><span className="font-display font-bold leading-tight">{n}</span>{mine && <Check className="h-5 w-5 text-primary shrink-0" />}</div>
            </button>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground" data-testid="text-votes-in"><Users className="inline h-4 w-4 mr-1" />{ts.submittedVotes} votes in. Votes are final for this ballot.{runoff && " If this runoff also ties, a draw between tied leaders decides."}</p>
      <Tallies v={v} />
    </Stage>
  );
}

function Lobby({ v, isHost, settings, start, apply, call, playerId }: { v: TournamentView; isHost: boolean; settings: ReturnType<typeof useSetTournamentSettings>; start: ReturnType<typeof useStartTournament>; apply: { onSuccess: (nv: TournamentView) => void; onError: () => void }; call: { code: string; data: { playerId: string } }; playerId: string }) {
  const [copied, setCopied] = useState(false);
  const s = v.settings;
  const active = v.teams.slice(0, s.teamCount);
  const ready = active.length >= 1 && active.every((t) => t.playerCount >= 1 && t.playerCount <= 10);
  const set = (p: Partial<typeof s>) => settings.mutate({ code: v.code, data: { playerId, teamCount: p.teamCount ?? s.teamCount, casesPerTournament: (p.casesPerTournament ?? s.casesPerTournament) as 1 | 3 | 5 | 7 | 10, votingSeconds: p.votingSeconds ?? s.votingSeconds } }, apply);
  const chip = (on: boolean) => "min-w-12 px-4 py-2.5 rounded-xl border-2 font-bold transition " + (on ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary");
  return (
    <>
      <Stage eyebrow="Lobby" title="Gather the teams">
        <div className="flex items-center gap-3 flex-wrap">
          <span data-testid="text-room-code" className="font-mono text-4xl sm:text-5xl tracking-[0.3em] text-primary border-2 border-primary rounded-2xl px-5 py-3">{v.code}</span>
          <button data-testid="button-copy" onClick={() => { navigator.clipboard?.writeText(v.code); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="p-3 rounded-xl border border-border hover:border-primary">{copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}</button>
        </div>
      </Stage>
      <div className="space-y-4">
        {active.map((t) => {
          const members = v.players.filter((p) => p.teamId === t.id); const ok = t.playerCount >= 1 && t.playerCount <= 10;
          return (
            <section key={t.id} data-testid={"card-team-" + t.id} className="rounded-2xl border-2 bg-card p-4" style={{ borderColor: teamColor(t.id) + "88" }}>
              <div className="flex justify-between items-center"><h3 className="font-display text-2xl font-bold" style={{ color: teamColor(t.id) }}>{t.name}</h3><span className={"font-mono text-sm " + (ok ? "text-primary" : "text-muted-foreground")}>{t.playerCount} / 10 · {ok ? "Ready" : "Not ready"}</span></div>
              <p className="text-sm text-muted-foreground mt-2">1-10 players per team</p>
              <div className="flex flex-wrap gap-2 mt-3">{members.length === 0 && <span className="text-sm text-muted-foreground">Nobody yet</span>}
                {members.map((p) => <span key={p.id} data-testid={"row-player-" + p.id} className={"px-3 py-1.5 rounded-full bg-secondary text-sm flex items-center gap-1.5 " + (p.connected ? "" : "opacity-50")}>{p.isHost && <Crown className="h-3.5 w-3.5 text-primary" />}{p.displayName}{p.id === playerId && " (you)"}</span>)}</div>
            </section>
          );
        })}
      </div>
      {isHost ? (
        <section className="rounded-2xl border border-border bg-card p-5 space-y-5" data-testid="panel-host-setup">
          <div><p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">Teams</p><div className="flex gap-2 flex-wrap">{[1, 2, 3, 4, 5].map((n) => <button key={n} data-testid={"button-teams-" + n} onClick={() => set({ teamCount: n })} className={chip(s.teamCount === n)}>{n}</button>)}</div></div>
          <div><p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">Cases</p><div className="flex gap-2 flex-wrap">{[1, 3, 5, 7, 10].map((n) => <button key={n} data-testid={"button-cases-" + n} onClick={() => set({ casesPerTournament: n })} className={chip(s.casesPerTournament === n)}>{n}</button>)}</div></div>
          <div><p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">Voting seconds</p><div className="flex gap-2 flex-wrap">{[30, 45, 60, 90, 120].map((n) => <button key={n} data-testid={"button-seconds-" + n} onClick={() => set({ votingSeconds: n })} className={chip(s.votingSeconds === n)}>{n}</button>)}</div></div>
          <button data-testid="button-start" disabled={!ready || start.isPending} onClick={() => start.mutate(call, apply)} className={bigBtn}>{start.isPending ? "Starting..." : "Start tournament"}<ArrowRight className="h-6 w-6" /></button>
          {!ready && <p className="text-sm text-muted-foreground">Every team needs at least 1 player to start. 1-10 players per team.</p>}
          {settings.isError && <p className="text-sm text-destructive">Could not save settings.</p>}
        </section>
      ) : (
        <p className="text-center text-muted-foreground" data-testid="text-waiting-host">{s.casesPerTournament} cases, {s.votingSeconds}s votes. Waiting for the host to start.</p>
      )}
    </>
  );
}

function Leaderboard({ v }: { v: TournamentView }) {
  const sorted = [...v.teams].sort((a, b) => b.score - a.score);
  const max = Math.max(1, ...sorted.map((t) => t.score));
  return (
    <div className="space-y-2.5" data-testid="list-leaderboard">
      {sorted.map((t) => (
        <div key={t.id} data-testid={"row-rank-" + t.id} className="rounded-2xl bg-card border border-border p-3 relative overflow-hidden">
          <div className="absolute inset-y-0 left-0 opacity-25 origin-left transition-transform duration-700" style={{ width: "100%", transform: `scaleX(${t.score / max})`, background: teamColor(t.id) }} />
          <div className="relative flex items-center gap-3"><span className="font-display text-2xl font-bold w-8 text-center">{sorted[0]!.score === t.score ? <Medal className="h-7 w-7 text-primary mx-auto" /> : sorted.findIndex(other => other.score === t.score) + 1}</span><span className="flex-1 min-w-0 font-semibold text-lg">{t.name}</span><span className="font-mono text-2xl font-bold">{t.score}</span></div>
        </div>
      ))}
    </div>
  );
}

function Reveal({ v, isHost, next, opts, call, onShowChampions }: { v: TournamentView; isHost: boolean; next: ReturnType<typeof useNextTournamentRound>; opts: { onSuccess: (nv: TournamentView) => void; onError: () => void }; call: { code: string; data: { playerId: string } }; onShowChampions?: () => void }) {
  const r = v.reveal!; const [step, setStep] = useState(0);
  return (
    <>
      {step === 0 ? (
        <>
          <Stage eyebrow="Case closed" title="The culprit was">
            <div className="gold-card rounded-3xl p-6 sm:p-8"><p data-testid="text-culprit" className="font-display text-5xl sm:text-6xl font-bold">{r.culprit}</p></div>
            <div className="space-y-3 text-lg"><p data-testid="text-what"><b className="text-primary">What happened.</b> {r.what}</p><p data-testid="text-why"><b className="text-primary">Why.</b> {r.why}</p></div>
          </Stage>
          <button data-testid="button-show-results" onClick={() => setStep(1)} className={bigBtn}>Team results<ArrowRight className="h-6 w-6" /></button>
        </>
      ) : (
        <>
          <Stage eyebrow="Round results" title="Who got it?">
            <div className="space-y-2">{r.results.map((x) => (
              <div key={x.teamId} data-testid={"row-result-" + x.teamId} className="rounded-2xl border border-border bg-card p-3 flex items-center gap-3">
                <span className={"h-10 w-10 rounded-full grid place-items-center shrink-0 " + (x.correct ? "bg-primary text-primary-foreground" : "bg-destructive/20 text-destructive")}>{x.correct ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}</span>
                <div className="flex-1 min-w-0"><div className="font-semibold">{x.teamName}</div><div className="text-sm text-muted-foreground truncate">{x.suspect ?? "No vote"} / {x.extraClues} extra clue{x.extraClues === 1 ? "" : "s"}</div></div>
                <span className="font-mono text-xl font-bold">+{x.points}</span></div>))}</div>
          </Stage>
          <div><p className={eyebrow + " mb-3"}>Leaderboard</p><Leaderboard v={v} /></div>
          {onShowChampions ? <button data-testid="button-show-champions" onClick={onShowChampions} className={bigBtn}>Show champions<Trophy className="h-6 w-6" /></button>
            : isHost ? <button data-testid="button-next-round" disabled={next.isPending} onClick={() => next.mutate(call, opts)} className={bigBtn}>Next case<ArrowRight className="h-6 w-6" /></button>
            : <p className="text-center text-muted-foreground" data-testid="text-waiting-host">Waiting for the host to continue.</p>}
        </>
      )}
    </>
  );
}

function Finished({ v, isHost, reset, opts, call, onReview }: { v: TournamentView; isHost: boolean; reset: ReturnType<typeof useResetTournament>; opts: { onSuccess: (nv: TournamentView) => void; onError: () => void }; call: { code: string; data: { playerId: string } }; onReview: () => void }) {
  const [, nav] = useLocation();
  const done = useRef(false);
  useEffect(() => { done.current = true; }, []);
  return (
    <>
      <Confetti />
      <Stage eyebrow="Case Files champions" title="">
        <div className="gold-card rounded-3xl p-8 text-center">
          <Trophy className="h-14 w-14 mx-auto" />
          <p data-testid="text-champion" className="font-display text-5xl sm:text-6xl font-bold mt-3">{v.winners.join(" & ") || "No winner"}</p>
        </div>
      </Stage>
      <div><p className={eyebrow + " mb-3"}>Final rankings</p><Leaderboard v={v} /></div>
      {v.awards.length > 0 && <div><p className={eyebrow + " mb-3"}>Awards</p>
        <div className="grid sm:grid-cols-2 gap-3">{v.awards.map((a) => (
          <div key={a.name} data-testid={"card-award-" + a.name} className="min-w-0 rounded-2xl border border-border bg-card p-4 break-words"><Medal className="h-5 w-5 text-primary" /><div className="font-display text-xl font-bold mt-1">{a.name}</div><div className="text-muted-foreground">{a.teamNames.join(", ") || "Nobody this tournament"}</div><div className="font-mono text-sm text-primary">
            {a.name === "Clue Hoarders" ? `${a.value + 3 * v.settings.casesPerTournament} clues used`
              : a.name === "Bold Detectives" ? (a.teamNames.length ? `${a.value + 3} clues in a correct solve` : "No correct solves")
              : a.name === "Prince Blamers" ? `${a.value} votes for Prince`
              : `${a.value} cases solved`}
          </div></div>))}</div></div>}
      <button data-testid="button-review-final-case" onClick={onReview} className="w-full text-primary py-2 underline">Review the final case</button>
      {isHost && <button data-testid="button-new-tournament" disabled={reset.isPending} onClick={() => reset.mutate(call, opts)} className={bigBtn}><RotateCcw className="h-6 w-6" />New tournament</button>}
      {!isHost && <p className="text-center text-muted-foreground">The host can start a new tournament.</p>}
      <button data-testid="button-home" onClick={() => { clearSession(); nav("/"); }} className="w-full text-muted-foreground py-2 flex items-center justify-center gap-2"><Home className="h-4 w-4" />Leave game</button>
    </>
  );
}
