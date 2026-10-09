import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useCreateTournament, useJoinTournament, useGetTournamentLobby, getGetTournamentLobbyQueryKey } from "@workspace/api-client-react";
import { loadSession, saveSession } from "@/lib/session";
import { teamColor } from "@/components/tournament-bits";
import { Trophy, KeyRound, BookOpen, ArrowLeft, ArrowRight, ShieldCheck, Users, Play, Check } from "lucide-react";

type Mode = "menu" | "create" | "join" | "rules";
type F = { name: string; code: string; consent: boolean };
const field = "w-full bg-background/60 border-2 border-border focus:border-primary rounded-xl px-4 py-3.5 text-lg outline-none transition-colors";
const bigBtn = "w-full bg-primary text-primary-foreground font-bold text-lg py-4 rounded-xl hover:brightness-110 active:scale-[.98] transition disabled:opacity-40 flex items-center justify-center gap-2";

export default function Home() {
  const [, nav] = useLocation();
  const [mode, setMode] = useState<Mode>("menu");
  const [err, setErr] = useState("");
  const [teamId, setTeamId] = useState<number | null>(null);
  const [lobbyCode, setLobbyCode] = useState("");
  const { register, handleSubmit, watch } = useForm<F>({ defaultValues: { name: "", code: "", consent: false } });
  const create = useCreateTournament();
  const join = useJoinTournament();
  const lobby = useGetTournamentLobby(lobbyCode, { query: { enabled: !!lobbyCode, queryKey: getGetTournamentLobbyQueryKey(lobbyCode), retry: false } });
  const session = loadSession();
  const w = watch();
  const go = (m: Mode) => { setMode(m); setErr(""); };

  const onCreate = (v: F) => {
    setErr("");
    create.mutate({ data: { displayName: v.name.trim(), consentAcknowledged: true } }, {
      onSuccess: (r) => { saveSession({ code: r.code, playerId: r.me.id }); nav("/room/" + r.code); },
      onError: () => setErr("Could not open a tournament. Try again."),
    });
  };
  const onJoin = (v: F) => {
    setErr("");
    if (teamId === null) return setErr("Pick a team first.");
    join.mutate({ code: lobbyCode, data: { displayName: v.name.trim(), teamId, consentAcknowledged: true } }, {
      onSuccess: (r) => { saveSession({ code: r.code, playerId: r.me.id }); nav("/room/" + r.code); },
      onError: () => setErr("Could not join. That team may be full or the game already started."),
    });
  };
  const findCode = () => { const c = w.code.trim().toUpperCase(); if (c) { setLobbyCode(c); setTeamId(null); setErr(""); } };

  return (
    <div className="min-h-[100dvh] stage-bg flex flex-col">
      <header className="px-5 py-5 max-w-3xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 font-display font-bold text-xl"><Trophy className="h-6 w-6 text-primary" />BDS Case Files</div>
        {mode !== "menu" && <button data-testid="button-back" onClick={() => go("menu")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back</button>}
      </header>
      <main className="flex-1 max-w-3xl w-full mx-auto px-5 pb-10">
        <div key={mode + (lobbyCode && mode === "join" ? "-l" : "")} className="screen-in">
          {mode === "menu" && (
            <div className="pt-6 sm:pt-14">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary mb-4">Workplace mystery night</p>
              <h1 className="font-display text-5xl sm:text-7xl font-bold leading-[0.98]">Who did it?<br /><span className="text-primary">Your team votes.</span></h1>
              <p className="mt-5 text-lg text-muted-foreground max-w-lg">Teams of colleagues read the same fictional office clues, argue it out, and vote. Fewer clues, more points.</p>
              {session && <button data-testid="button-resume" onClick={() => nav("/room/" + session.code)} className="mt-6 w-full text-left border-2 border-primary bg-primary/10 rounded-xl px-5 py-4 flex items-center justify-between"><span><span className="block font-mono text-xs uppercase tracking-widest text-primary">Game in progress</span><span className="font-display text-xl">Rejoin {session.code}</span></span><ArrowRight className="h-5 w-5 text-primary" /></button>}
              <div className="mt-8 grid gap-3">
                <button data-testid="button-create" onClick={() => go("create")} className={bigBtn + " py-6 text-xl"}><Play className="h-6 w-6" />Host a tournament</button>
                <button data-testid="button-join" onClick={() => go("join")} className="w-full border-2 border-primary text-primary font-bold text-lg py-5 rounded-xl hover:bg-primary/10 flex items-center justify-center gap-2"><KeyRound className="h-5 w-5" />Join with a code</button>
                <button data-testid="button-rules" onClick={() => go("rules")} className="text-muted-foreground hover:text-foreground py-2 flex items-center justify-center gap-2 text-sm"><BookOpen className="h-4 w-4" />Rules and privacy</button>
              </div>
            </div>
          )}

          {mode === "create" && (
            <form onSubmit={handleSubmit(onCreate)} className="pt-8 space-y-5">
              <h2 className="font-display text-4xl font-bold">Host a tournament</h2>
              <p className="text-muted-foreground">1 to 5 teams, 1-10 players per team. You will set the teams and rounds in the lobby.</p>
              <NameConsent register={register} />
              {err && <p data-testid="text-error" className="text-destructive">{err}</p>}
              <button data-testid="button-submit" disabled={create.isPending || !w.name.trim() || !w.consent} className={bigBtn}>{create.isPending ? "Opening..." : "Open lobby"}<ArrowRight className="h-5 w-5" /></button>
            </form>
          )}

          {mode === "join" && (
            <form onSubmit={handleSubmit(onJoin)} className="pt-8 space-y-5">
              <h2 className="font-display text-4xl font-bold">Join a tournament</h2>
              <div className="flex gap-2">
                <input data-testid="input-code" {...register("code")} onChange={(e) => { e.target.value = e.target.value.toUpperCase(); register("code").onChange(e); }} placeholder="CODE" className={field + " font-mono tracking-[0.3em] uppercase"} />
                <button type="button" data-testid="button-find" onClick={findCode} className="px-6 rounded-xl bg-secondary font-semibold hover:bg-secondary/70">Find</button>
              </div>
              {lobbyCode && lobby.isLoading && <div className="h-28 rounded-xl bg-card animate-pulse" />}
              {lobbyCode && lobby.isError && <p data-testid="text-error" className="text-destructive">No open tournament with that code.</p>}
              {lobby.data && lobby.data.status !== "lobby" && <p className="text-destructive">That game has already started.</p>}
              {lobby.data && lobby.data.status === "lobby" && (
                <>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-primary mb-2">Choose your team</p>
                    <div className="grid grid-cols-2 gap-3">
                      {lobby.data.teams.map((t) => {
                        const full = t.playerCount >= 10; const on = teamId === t.id;
                        return (
                          <button type="button" key={t.id} disabled={full} data-testid={"button-team-" + t.id} onClick={() => setTeamId(t.id)}
                            className="text-left rounded-xl p-4 border-2 transition disabled:opacity-40 active:scale-[.97]"
                            style={{ borderColor: on ? teamColor(t.id) : "hsl(var(--border))", background: on ? teamColor(t.id) + "22" : "hsl(var(--card))" }}>
                            <div className="flex justify-between"><span className="h-3 w-3 rounded-full mt-1.5" style={{ background: teamColor(t.id) }} />{on && <Check className="h-5 w-5" style={{ color: teamColor(t.id) }} />}</div>
                            <div className="font-display text-xl font-bold mt-2">{t.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1"><Users className="h-3.5 w-3.5" />{t.playerCount}/10{full ? " full" : ""}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <NameConsent register={register} />
                  {err && <p data-testid="text-error" className="text-destructive">{err}</p>}
                  <button data-testid="button-submit" disabled={join.isPending || teamId === null || !w.name.trim() || !w.consent} className={bigBtn}>{join.isPending ? "Joining..." : "Join team"}<ArrowRight className="h-5 w-5" /></button>
                </>
              )}
            </form>
          )}

          {mode === "rules" && (
            <div className="pt-8 space-y-5" data-testid="panel-rules">
              <h2 className="font-display text-4xl font-bold">How it works</h2>
              <ol className="space-y-3 text-lg">
                {["Everyone gets the same case. Your team sees three clues, one at a time.", "Ask for extra clues if you dare. Each costs 10 points off a 100 point case.", "Every player gets one final vote. Ties get a 30-second runoff, then a draw if still tied.", "The culprit is revealed to all teams. Right answer scores the case value, wrong scores zero.", "Highest total after the last case wins."].map((t, i) => (
                  <li key={i} className="flex gap-4"><span className="font-display text-primary text-2xl font-bold w-6">{i + 1}</span><span>{t}</span></li>
                ))}
              </ol>
              <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 flex gap-3"><ShieldCheck className="h-6 w-6 text-primary shrink-0" /><p className="text-sm">Everything is fictional. Characters, clues and misdeeds are invented and no real person is accused of anything. Use a made-up alias and never enter personal information. Only live game state is kept.</p></div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function NameConsent({ register }: { register: ReturnType<typeof useForm<F>>["register"] }) {
  return (
    <>
      <label className="block font-semibold">Fictional alias
        <input data-testid="input-name" {...register("name")} maxLength={24} placeholder="e.g. Captain Stapler" className={field + " mt-2 font-normal"} />
      </label>
      <label className="flex gap-3 items-start text-sm text-muted-foreground cursor-pointer">
        <input data-testid="checkbox-consent" type="checkbox" {...register("consent")} className="mt-1 h-5 w-5 accent-[hsl(43,70%,52%)]" />
        <span>I understand this is a fictional game, I am using an alias, and I will not share personal information.</span>
      </label>
    </>
  );
}
