export default function Slide07() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text font-body flex">
      <aside className="w-[22vw] shrink-0 border-r border-white/5 px-[3vw] py-[5vh] flex flex-col">
        <div className="flex items-center gap-[1vw] mb-[6vh]"><span className="w-[1.5vw] h-[1.5vw] bg-primary rounded-[0.25vw]" /><p className="text-white font-bold text-[1.5vw]">BDS Case Files</p></div>
        <p className="text-muted text-[1.5vw] uppercase tracking-wide mb-[2vh]">Getting started</p>
        <div className="space-y-[2vh] text-[1.5vw] mb-[5vh]"><p className="text-muted">Overview</p><p className="text-muted">Safe play</p><p className="text-muted">Room setup</p></div>
        <p className="text-muted text-[1.5vw] uppercase tracking-wide mb-[2vh]">Playing a case</p>
        <div className="space-y-[2vh] text-[1.5vw]"><p className="text-primary font-bold">Investigation</p><p className="text-muted">Resolution</p><p className="text-muted">Replay</p></div>
        <p className="mt-auto text-[1.5vw] font-mono text-muted">07 / 12</p>
      </aside>
      <main className="flex-1 min-w-0 px-[6vw] pt-[7vh] pb-[5vh] flex flex-col">
        <p className="text-primary text-[1.5vw] font-bold uppercase tracking-wide mb-[2vh]">Game mechanics</p>
        <h1 className="text-[3.6vw] leading-[1.1] tracking-tight text-white font-display font-bold mb-[4vh]">Vote on the next investigation</h1>
        <div className="space-y-[0.5vh]"><div className="flex gap-[1.5vw] items-start py-[1.25vh] border-b border-white/10 ">
            <span className="text-primary font-mono text-[1.5vw] pt-[0.5vh] w-[2.5vw] shrink-0">01</span>
            <p className="text-[2vw] leading-[1.3] text-text" data-copy>Each connected player votes for one available action</p>
          </div>
<div className="flex gap-[1.5vw] items-start py-[1.25vh] border-b border-white/10 ">
            <span className="text-primary font-mono text-[1.5vw] pt-[0.5vh] w-[2.5vw] shrink-0">02</span>
            <p className="text-[2vw] leading-[1.3] text-text" data-copy>A strict majority completes the action immediately</p>
          </div>
<div className="flex gap-[1.5vw] items-start py-[1.25vh] border-b border-white/10 ">
            <span className="text-primary font-mono text-[1.5vw] pt-[0.5vh] w-[2.5vw] shrink-0">03</span>
            <p className="text-[2vw] leading-[1.3] text-text" data-copy>If everyone votes without a majority, the largest vote total wins</p>
          </div>
<div className="flex gap-[1.5vw] items-start py-[1.25vh] border-b border-white/10 ">
            <span className="text-primary font-mono text-[1.5vw] pt-[0.5vh] w-[2.5vw] shrink-0">04</span>
            <p className="text-[2vw] leading-[1.3] text-text" data-copy>A tie favors the host’s vote among tied leaders; otherwise fixed action order decides</p>
          </div>
<div className="flex gap-[1.5vw] items-start py-[1.25vh] border-b border-white/10 ">
            <span className="text-primary font-mono text-[1.5vw] pt-[0.5vh] w-[2.5vw] shrink-0">05</span>
            <p className="text-[2vw] leading-[1.3] text-text" data-copy>Each completed action spends one team use and clears the votes</p>
          </div>
<div className="flex gap-[1.5vw] items-start py-[1.25vh] border-b border-white/10 ">
            <span className="text-primary font-mono text-[1.5vw] pt-[0.5vh] w-[2.5vw] shrink-0">06</span>
            <p className="text-[2vw] leading-[1.3] text-text" data-copy>Completed actions cannot be repeated</p>
          </div></div>
        <footer className="mt-auto pt-[2vh] text-right text-[1.5vw] text-muted">BDS Case Files</footer>
      </main>
    </div>
  );
}
