import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { useCreateTournament, useJoinTournament, useGetTournamentLobby, getGetTournamentLobbyQueryKey } from "@workspace/api-client-react";
import { loadSession, saveSession } from "@/lib/session";
import { errMsg } from "@/lib/err";
import { teamColor } from "@/components/tournament-bits";
import { KeyRound, BookOpen, ArrowLeft, ArrowRight, ShieldCheck, Users, Play, Check, Briefcase, Search, Vote, PartyPopper } from "lucide-react";

type Mode = "menu" | "create" | "join" | "rules";
type F = { name: string; code: string; consent: boolean };

export default function Home() {
  const [, nav] = useLocation();
  const [mode, setMode] = useState<Mode>("menu");
  const [err, setErr] = useState("");
  const [teamId, setTeamId] = useState<number | null>(null);
  const [lobbyCode, setLobbyCode] = useState("");
  const { register, handleSubmit, watch, setValue } = useForm<F>({ defaultValues: { name: "", code: "", consent: false } });
  const create = useCreateTournament();
  const join = useJoinTournament();
  const lobby = useGetTournamentLobby(lobbyCode, { query: { enabled: !!lobbyCode && mode === "join", queryKey: getGetTournamentLobbyQueryKey(lobbyCode), retry: false, refetchInterval: 5000 } });
  const rosterKey = lobby.data?.teams.map(t => `${t.id}:${t.name}`).join("|");
  useEffect(() => { setTeamId(null); }, [rosterKey]);
  const session = loadSession();
  const w = watch();
  const go = (m: Mode) => { setMode(m); setErr(""); };

  const onCreate = (v: F) => {
    setErr("");
    create.mutate({ data: { displayName: v.name.trim(), consentAcknowledged: true } }, {
      onSuccess: (r) => { saveSession({ code: r.code, playerId: r.me.id }); nav("/room/" + r.code); },
      onError: (e) => setErr(errMsg(e, "Could not open a game. Try again.")),
    });
  };
  const onJoin = (v: F) => {
    setErr("");
    if (teamId === null) return setErr("Pick a team first.");
    join.mutate({ code: lobbyCode, data: { displayName: v.name.trim(), teamId, consentAcknowledged: true } }, {
      onSuccess: (r) => { saveSession({ code: r.code, playerId: r.me.id }); nav("/room/" + r.code); },
      onError: (e) => setErr(errMsg(e, "Could not join. That team may be full or the game already started.")),
    });
  };
  const findCode = () => { const c = w.code.trim().toUpperCase(); if (c) { setLobbyCode(c); setTeamId(null); setErr(""); } };

  const steps = [
    { Icon: Briefcase, t: "Read the case", d: "Something went wrong at the office. Same story for every team." },
    { Icon: Search, t: "Argue it out", d: "Clues drop one at a time. Talk it over with your team." },
    { Icon: Vote, t: "Accuse someone", d: "Everyone votes. Fewer clues means more points." },
  ];

  return (
    <div className="min-h-[100dvh] stage-bg flex flex-col">
      <header className="px-5 py-5 max-w-3xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 font-display font-extrabold text-lg"><span className="bg-primary text-primary-foreground border-2 border-foreground rounded-lg p-1.5 -rotate-6"><PartyPopper className="h-5 w-5" /></span>CASE FILES: OFFICE EDITION</div>
        {mode !== "menu" && <button data-testid="button-back" onClick={() => go("menu")} className="flex items-center gap-1 font-bold min-h-11 px-2"><ArrowLeft className="h-4 w-4" />Back</button>}
      </header>
      <main className="flex-1 max-w-3xl w-full mx-auto px-5 pb-10">
        <div key={mode + (lobbyCode && mode === "join" ? "-l" : "")} className="screen-in">
          {mode === "menu" && (
            <div className="pt-4 sm:pt-10">
              <h1 className="font-display text-6xl sm:text-8xl font-extrabold leading-[.92]">Who did<br />it? <span className="text-primary inline-block -rotate-3">Vote.</span></h1>
              <p className="mt-5 text-xl max-w-lg">The office party game where teams read the clues, point fingers, and fight for bragging rights.</p>
              <div className="mt-7 grid sm:grid-cols-3 gap-3">
                {steps.map(({ Icon, t, d }, i) => (
                  <div key={t} className="pop p-4" style={{ transform: `rotate(${[-1.2, .8, -.6][i]}deg)` }}>
                    <div className="flex items-center gap-2 font-display font-extrabold text-xl"><span className="h-8 w-8 rounded-full bg-secondary border-2 border-foreground grid place-items-center"><Icon className="h-4 w-4" /></span>{i + 1}. {t}</div>
                    <p className="mt-2 text-sm text-muted-foreground">{d}</p>
                  </div>
                ))}
              </div>
              {session && <button data-testid="button-resume" onClick={() => nav("/room/" + session.code)} className="mt-6 pop w-full text-left px-5 py-4 flex items-center justify-between bg-secondary"><span><span className="block font-mono text-xs uppercase tracking-widest">Game in progress</span><span className="font-display font-bold text-2xl">Rejoin {session.code}</span></span><ArrowRight className="h-6 w-6" /></button>}
              <div className="mt-6 grid gap-4">
                <button data-testid="button-create" onClick={() => go("create")} className="btn-big"><Play className="h-6 w-6" />Host a game</button>
                <button data-testid="button-join" onClick={() => go("join")} className="btn-big btn-alt"><KeyRound className="h-6 w-6" />Join with a code</button>
                <button data-testid="button-rules" onClick={() => go("rules")} className="font-bold py-2 flex items-center justify-center gap-2 underline"><BookOpen className="h-4 w-4" />Rules and privacy</button>
              </div>
            </div>
          )}

          {mode === "create" && (
            <form onSubmit={handleSubmit(onCreate)} className="pt-6 space-y-5">
              <h2 className="font-display text-5xl font-extrabold">Host a game</h2>
              <p className="text-lg">1 to 5 teams, 1 to 10 players per team. You run the show: you set up the teams and move everyone through each screen.</p>
              <NameConsent register={register} />
              {err && <p data-testid="text-error" role="alert" className="font-bold text-destructive">{err}</p>}
              <button data-testid="button-submit" disabled={create.isPending || !w.name.trim() || !w.consent} className="btn-big">{create.isPending ? "Opening..." : "Open lobby"}<ArrowRight className="h-6 w-6" /></button>
            </form>
          )}

          {mode === "join" && (
            <form onSubmit={handleSubmit(onJoin)} className="pt-6 space-y-5">
              <h2 className="font-display text-5xl font-extrabold">Join a game</h2>
              <div className="flex gap-2">
                <input data-testid="input-code" aria-label="Game code" {...register("code")} onChange={(e) => setValue("code", e.target.value.toUpperCase())} placeholder="CODE" className="field font-mono tracking-[0.3em] uppercase" />
                <button type="button" data-testid="button-find" onClick={findCode} className="px-6 pop font-extrabold bg-secondary">Find</button>
              </div>
              {lobbyCode && lobby.isLoading && <div className="h-28 rounded-xl bg-card animate-pulse" />}
              {lobbyCode && lobby.isError && <p data-testid="text-error" role="alert" className="font-bold text-destructive">No open game with that code.</p>}
              {lobby.data && lobby.data.status !== "lobby" && <p className="font-bold text-destructive">That game has already started.</p>}
              {lobby.data && lobby.data.status === "lobby" && (
                <>
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest mb-2">Choose your team</p>
                    <div className="grid grid-cols-2 gap-3">
                      {lobby.data.teams.map((t) => {
                        const full = t.playerCount >= 10; const on = teamId === t.id;
                        return (
                          <button type="button" key={t.id} disabled={full} aria-pressed={on} data-testid={"button-team-" + t.id} onClick={() => setTeamId(t.id)}
                            className="pop text-left p-4 transition disabled:opacity-40 active:translate-y-1" style={{ background: on ? teamColor(t.id) : undefined, color: on ? "#fff" : undefined }}>
                            <div className="flex justify-between"><span className="h-3.5 w-3.5 rounded-full border-2 border-foreground mt-1.5" style={{ background: teamColor(t.id) }} />{on && <Check className="h-5 w-5" />}</div>
                            <div className="font-display text-xl font-extrabold mt-2 break-words">{t.name}</div>
                            <div className="text-sm flex items-center gap-1"><Users className="h-3.5 w-3.5" />{t.playerCount}/10{full ? " full" : ""}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <NameConsent register={register} />
                  {err && <p data-testid="text-error" role="alert" className="font-bold text-destructive">{err}</p>}
                  {lobby.data.status !== "lobby" && <p className="font-bold text-destructive">This tournament has already started. New players join before the host starts.</p>}
                  <button data-testid="button-submit" disabled={lobby.data.status !== "lobby" || join.isPending || teamId === null || !w.name.trim() || !w.consent} className="btn-big">{join.isPending ? "Joining..." : "Join team"}<ArrowRight className="h-6 w-6" /></button>
                </>
              )}
            </form>
          )}

          {mode === "rules" && (
            <div className="pt-6 space-y-5" data-testid="panel-rules">
              <h2 className="font-display text-5xl font-extrabold">How it works</h2>
              <ol className="space-y-3 text-lg">
                {["Everyone plays the same case. The host moves the whole room through the brief, the team members and the first three clues, so nobody is ahead or behind.",
                  "On the team decision screen, any teammate can ask for a private extra clue. Extras can differ per team and each one costs 10 points, up to 7.",
                  "Easy cases are worth 100, Medium 150 and Hard 200, minus 10 for every extra clue.",
                  "Only the host opens voting, and it opens for every team at once, even teams still reading extras. Teammates can tap Ready to tell the host they are set.",
                  "Everyone votes. Ties get a 30 second runoff. Then the host reveals the culprit, the results, and finally the champions."].map((t, i) => (
                  <li key={i} className="flex gap-4"><span className="font-display text-primary text-3xl font-extrabold w-7 shrink-0">{i + 1}</span><span>{t}</span></li>
                ))}
              </ol>
              <div className="pop bg-secondary p-4 flex gap-3"><ShieldCheck className="h-6 w-6 shrink-0" /><p className="text-sm">Everything is fictional. Characters, clues and misdeeds are invented and no real person is accused of anything. Use a made-up alias and never enter personal information. Only live game state is kept in memory, with no history.</p></div>
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
      <label className="block font-bold">Fictional alias
        <input data-testid="input-name" {...register("name")} maxLength={24} placeholder="e.g. Captain Stapler" className="field mt-2 font-normal" />
      </label>
      <label className="flex gap-3 items-start text-sm cursor-pointer">
        <input data-testid="checkbox-consent" type="checkbox" {...register("consent")} className="mt-1 h-6 w-6 accent-[hsl(7,82%,56%)]" />
        <span>I understand this is a fictional game, I am using an alias, and I will not share personal information.</span>
      </label>
    </>
  );
}
