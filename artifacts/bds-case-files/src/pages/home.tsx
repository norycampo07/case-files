import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateRoom, useJoinRoom, useHealthCheck } from "@workspace/api-client-react";
import { loadSession, saveSession } from "@/lib/session";
import { Search, Users, BookOpen, Award, KeyRound, FolderOpen } from "lucide-react";

type Panel = "none" | "start" | "join" | "rules" | "credits";

export default function Home() {
  const [, nav] = useLocation();
  const [panel, setPanel] = useState<Panel>("none");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const create = useCreateRoom();
  const join = useJoinRoom();
  const health = useHealthCheck({ query: { queryKey: ["health"], refetchInterval: 15000, retry: false } as never });
  const session = loadSession();
  const online = health.isSuccess;

  const submitStart = () => {
    setErr("");
    create.mutate({ data: { displayName: name.trim(), consentAcknowledged: true } }, {
      onSuccess: (r) => { saveSession({ code: r.code, playerId: r.me.id }); nav("/room/" + r.code); },
      onError: () => setErr("Could not open a case file. Check the server and try again."),
    });
  };
  const submitJoin = () => {
    setErr("");
    const c = code.trim().toUpperCase();
    join.mutate({ code: c, data: { displayName: name.trim(), consentAcknowledged: true } }, {
      onSuccess: (r) => { saveSession({ code: r.code, playerId: r.me.id }); nav("/room/" + r.code); },
      onError: () => setErr("No open case with that code, or it has already begun."),
    });
  };

  const tiles: { id: Panel; icon: typeof Search; title: string; sub: string }[] = [
    { id: "start", icon: FolderOpen, title: "Start New Case", sub: "Open a file and invite your team" },
    { id: "join", icon: KeyRound, title: "Join Case", sub: "Enter a code from your host" },
    { id: "rules", icon: BookOpen, title: "Rules", sub: "How the agency works" },
    { id: "credits", icon: Award, title: "Credits", sub: "Who built this" },
  ];

  return (
    <div className="min-h-[100dvh] board-bg">
      <header className="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 border-2 border-primary grid place-items-center font-display text-primary font-bold">B</div>
          <span className="font-display text-lg tracking-wide">BDS Case Files</span>
        </div>
        <span data-testid="status-server" className="text-xs font-mono flex items-center gap-2 text-muted-foreground">
          <span className={"h-2 w-2 rounded-full " + (online ? "bg-primary" : "bg-destructive")} />
          {online ? "Server online" : health.isLoading ? "Checking server" : "Server unreachable"}
        </span>
      </header>

      <main className="max-w-6xl mx-auto px-5 pb-16 grid lg:grid-cols-[1.1fr_1fr] gap-10 pt-6 lg:pt-14">
        <section>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary mb-4">Cooperative detective agency</p>
          <h1 className="font-display text-5xl sm:text-6xl font-bold leading-[1.02]">Your colleagues are now <span className="text-primary">investigators.</span></h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl">Two to ten of you share one workplace mystery. Take a specialist role, compare clues, and unravel a harmless file mix-up before the action budget runs out.</p>
          <p className="mt-5 text-sm text-muted-foreground whitespace-pre-line">{"Welcome to Case Files.\nAll mysteries are fictional.\nAll clues are fabricated.\nAll suspects are innocent until randomly proven guilty."}</p>

          {session && (
            <button data-testid="button-resume" onClick={() => nav("/room/" + session.code)} className="mt-6 w-full sm:w-auto text-left border border-primary/60 bg-primary/10 px-4 py-3 rounded hover:bg-primary/20">
              <span className="block text-xs font-mono text-primary uppercase tracking-widest">Case in progress</span>
              <span className="font-display text-lg">Resume case {session.code}</span>
            </button>
          )}

          <div className="mt-8 grid sm:grid-cols-2 gap-3">
            {tiles.map((t) => (
              <button key={t.id} data-testid={"button-" + t.id} onClick={() => { setPanel(t.id); setErr(""); }}
                className={"text-left p-4 border rounded transition-colors " + (panel === t.id ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/60")}>
                <t.icon className="h-5 w-5 text-primary mb-3" />
                <div className="font-display text-lg">{t.title}</div>
                <div className="text-sm text-muted-foreground">{t.sub}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="lg:pt-6">
          <div className="paper rounded shadow-xl p-6 sm:p-8 min-h-[420px] relative border-l-[14px] border-primary/80">
            {panel === "none" && (
              <div className="h-full flex flex-col justify-center">
                <p className="font-mono text-xs uppercase tracking-widest opacity-60">Case notebook</p>
                <h2 className="font-display text-3xl mt-2">Choose a door.</h2>
                <ul className="mt-6 space-y-3 text-sm">
                  <li className="flex gap-3"><Users className="h-4 w-4 mt-0.5 shrink-0" />Five roles, each with a private brief and sometimes a clue only they hold.</li>
                  <li className="flex gap-3"><Search className="h-4 w-4 mt-0.5 shrink-0" />Six investigative actions. Ten to choose from. No repeats.</li>
                  <li className="flex gap-3"><Award className="h-4 w-4 mt-0.5 shrink-0" />Unspent actions score bonus points at the accusation.</li>
                </ul>
              </div>
            )}
            {(panel === "start" || panel === "join") && (
              <form onSubmit={(e) => { e.preventDefault(); panel === "start" ? submitStart() : submitJoin(); }} className="space-y-4">
                <p className="font-mono text-xs uppercase tracking-widest opacity-60">{panel === "start" ? "New file" : "Join file"}</p>
                <h2 className="font-display text-3xl">{panel === "start" ? "Open a new case" : "Join your team"}</h2>
                <label className="block text-sm font-semibold">Fictional detective alias
                  <input data-testid="input-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} required className="mt-1 w-full bg-white/70 border border-slate-400 px-3 py-2 rounded outline-none focus:border-slate-900" placeholder="e.g. Inspector Pencil" />
                </label>
                <p className="text-xs opacity-70">Do not use real names or personal information.</p>
                {panel === "join" && (
                  <label className="block text-sm font-semibold">Case code
                    <input data-testid="input-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required className="mt-1 w-full bg-white/70 border border-slate-400 px-3 py-2 rounded font-mono tracking-[0.3em] uppercase outline-none focus:border-slate-900" placeholder="CODE" />
                  </label>
                )}
                {err && <p data-testid="text-error" className="text-sm text-red-700">{err}</p>}
                <button data-testid="button-submit" disabled={create.isPending || join.isPending || !name.trim() || (panel === "join" && !code.trim())} className="w-full bg-[hsl(222,45%,12%)] text-[hsl(43,70%,60%)] font-semibold py-3 rounded disabled:opacity-50">
                  {create.isPending || join.isPending ? "Working..." : panel === "start" ? "Open case file" : "Join case"}
                </button>
              </form>
            )}
            {panel === "rules" && (
              <div className="text-sm space-y-3" data-testid="panel-rules">
                <h2 className="font-display text-3xl">Agency rules</h2>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>The host opens a case; 2 to 10 players join with the code. Only the host starts it.</li>
                  <li>Everyone gets a role, a private brief, and sometimes an extra clue. Share it or keep it; that is your call.</li>
                  <li>The team has 6 actions. Each round, everyone votes for one of ten actions. A majority wins; when all connected players have voted, plurality wins and the host breaks a tie.</li>
                  <li>An action can only be taken once. Not every finding points at the culprit.</li>
                  <li>The host files the final accusation: suspect, motive and method.</li>
                  <li>Score: 50 for the suspect, 25 for motive, 25 for method, and 10 per unused action.</li>
                  <li>Ranks: Rookie (under 50), Junior (50–74), Senior (75–99), Elite (100–129), Master (130+).</li>
                  <li>Rumors are playful leads, not allegations. The host may disable rumors or chat, reset a case, or start another with the same team.</li>
                  <li>Everything is fictional. Use aliases and avoid personal information. Only active session state is kept; reset and new case discard chat, notes, and investigation state.</li>
                </ol>
              </div>
            )}
            {panel === "credits" && (
              <div className="text-sm space-y-3" data-testid="panel-credits">
                <h2 className="font-display text-3xl">Credits</h2>
                <p>BDS Case Files is a template-driven cooperative mystery. Every case is assembled from hand-written parts: no AI services, no paid APIs.</p>
                <p>Type set in Fraunces, Plus Jakarta Sans and Spline Sans Mono. Icons by Lucide.</p>
                <p>Built for teams who solve problems together.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
