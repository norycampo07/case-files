export default function Slide08() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text font-body flex">
      <aside className="w-[22vw] shrink-0 border-r border-white/5 px-[3vw] py-[5vh] flex flex-col">
        <div className="flex items-center gap-[1vw] mb-[6vh]"><span className="w-[1.5vw] h-[1.5vw] bg-primary rounded-[0.25vw]" /><p className="text-white font-bold text-[1.5vw]">BDS Case Files</p></div>
        <p className="text-muted text-[1.5vw] uppercase tracking-wide mb-[2vh]">Getting started</p>
        <div className="space-y-[2vh] text-[1.5vw] mb-[5vh]"><p className="text-muted">Overview</p><p className="text-muted">Safe play</p><p className="text-muted">Room setup</p></div>
        <p className="text-muted text-[1.5vw] uppercase tracking-wide mb-[2vh]">Playing a case</p>
        <div className="space-y-[2vh] text-[1.5vw]"><p className="text-primary font-bold">Investigation</p><p className="text-muted">Resolution</p><p className="text-muted">Replay</p></div>
        <p className="mt-auto text-[1.5vw] font-mono text-muted">08 / 12</p>
      </aside>
      <main className="flex-1 min-w-0 px-[6vw] pt-[7vh] pb-[5vh] flex flex-col">
        <p className="text-primary text-[1.5vw] font-bold uppercase tracking-wide mb-[2vh]">Game mechanics</p>
        <h1 className="text-[3.6vw] leading-[1.1] tracking-tight text-white font-display font-bold mb-[4vh]">Compare clues—not just guesses</h1>
        <div className="space-y-[3vh]">
          <div className="bg-panel border border-white/10 rounded-[0.5vw] px-[2vw] py-[3vh]"><p className="text-[2vw] leading-[1.4] text-accent" data-copy>New clues appear on the shared evidence board</p></div>
          <p className="text-[2vw] leading-[1.35]" data-copy>Compare helpful clues, contradictions, red herrings, and timeline details</p>
          <div className="grid grid-cols-2 gap-[3vw]"><div className="bg-panel border border-white/10 rounded-[0.5vw] px-[2vw] py-[3vh]"><p className="text-[2vw] leading-[1.4] text-primary" data-copy>Share your private specialist information in team chat when enabled</p></div><div className="bg-panel border border-white/10 rounded-[0.5vw] px-[2vw] py-[3vh]"><p className="text-[2vw] leading-[1.4] text-primary" data-copy>Use suspect profiles and alibis to check your theory</p></div></div>
          <p className="text-[2vw] leading-[1.35] text-gold" data-copy>Keep personal investigation notes private; notes clear on reload or case replacement</p>
        </div>
        <footer className="mt-auto pt-[2vh] text-right text-[1.5vw] text-muted">BDS Case Files</footer>
      </main>
    </div>
  );
}
