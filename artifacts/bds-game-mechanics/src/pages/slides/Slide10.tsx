export default function Slide10() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text font-body flex">
      <aside className="w-[22vw] shrink-0 border-r border-white/5 px-[3vw] py-[5vh] flex flex-col">
        <div className="flex items-center gap-[1vw] mb-[6vh]"><span className="w-[1.5vw] h-[1.5vw] bg-primary rounded-[0.25vw]" /><p className="text-white font-bold text-[1.5vw]">BDS Case Files</p></div>
        <p className="text-muted text-[1.5vw] uppercase tracking-wide mb-[2vh]">Getting started</p>
        <div className="space-y-[2vh] text-[1.5vw] mb-[5vh]"><p className="text-muted">Overview</p><p className="text-muted">Safe play</p><p className="text-muted">Room setup</p></div>
        <p className="text-muted text-[1.5vw] uppercase tracking-wide mb-[2vh]">Playing a case</p>
        <div className="space-y-[2vh] text-[1.5vw]"><p className="text-muted">Investigation</p><p className="text-primary font-bold">Resolution</p><p className="text-muted">Replay</p></div>
        <p className="mt-auto text-[1.5vw] font-mono text-muted">10 / 12</p>
      </aside>
      <main className="flex-1 min-w-0 px-[6vw] pt-[7vh] pb-[5vh] flex flex-col">
        <p className="text-primary text-[1.5vw] font-bold uppercase tracking-wide mb-[2vh]">Game mechanics</p>
        <h1 className="text-[3.35vw] leading-[1.1] tracking-tight text-white font-display font-bold mb-[4vh]">Accuracy earns points. Unused actions add a bonus.</h1>
        <div className="grid grid-cols-2 gap-[3vw] items-stretch">
          <div className="bg-panel border border-white/10 rounded-[0.5vw] px-[2vw] py-[1vh]">
<p className="text-[2vw] leading-[1.35] py-[3vh] border-b border-white/10 last:border-0 text-text" data-copy>Correct suspect: +50 points</p>
<p className="text-[2vw] leading-[1.35] py-[3vh] border-b border-white/10 last:border-0 text-text" data-copy>Correct motive: +25 points</p>
<p className="text-[2vw] leading-[1.35] py-[3vh] border-b border-white/10 last:border-0 text-text" data-copy>Correct method: +25 points</p>
<p className="text-[2vw] leading-[1.35] py-[3vh] border-b border-white/10 last:border-0 text-accent" data-copy>Each unused team action: +10 points</p>
          </div>
          <div className="bg-accent/10 border border-accent/20 rounded-[0.5vw] px-[2vw] py-[4vh] flex flex-col justify-center">
            <p className="text-[2vw] leading-[1.4]" data-copy>Example: all three correct + three unused actions = <span className="block text-[8vw] leading-[1.15] text-accent font-bold mt-[3vh]">130</span>{' '}<span className="text-accent">points</span></p>
          </div>
        </div>
        <footer className="mt-auto pt-[2vh] text-right text-[1.5vw] text-muted">BDS Case Files</footer>
      </main>
    </div>
  );
}
