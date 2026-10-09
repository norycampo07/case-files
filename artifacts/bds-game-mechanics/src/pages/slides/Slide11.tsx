export default function Slide11() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text font-body flex">
      <aside className="w-[22vw] shrink-0 border-r border-white/5 px-[3vw] py-[5vh] flex flex-col">
        <div className="flex items-center gap-[1vw] mb-[6vh]"><span className="w-[1.5vw] h-[1.5vw] bg-primary rounded-[0.25vw]" /><p className="text-white font-bold text-[1.5vw]">BDS Case Files</p></div>
        <p className="text-muted text-[1.5vw] uppercase tracking-wide mb-[2vh]">Getting started</p>
        <div className="space-y-[2vh] text-[1.5vw] mb-[5vh]"><p className="text-muted">Overview</p><p className="text-muted">Safe play</p><p className="text-muted">Room setup</p></div>
        <p className="text-muted text-[1.5vw] uppercase tracking-wide mb-[2vh]">Playing a case</p>
        <div className="space-y-[2vh] text-[1.5vw]"><p className="text-muted">Investigation</p><p className="text-primary font-bold">Resolution</p><p className="text-muted">Replay</p></div>
        <p className="mt-auto text-[1.5vw] font-mono text-muted">11 / 12</p>
      </aside>
      <main className="flex-1 min-w-0 px-[6vw] pt-[7vh] pb-[5vh] flex flex-col">
        <p className="text-primary text-[1.5vw] font-bold uppercase tracking-wide mb-[2vh]">Game mechanics</p>
        <h1 className="text-[3.8vw] leading-[1.1] tracking-tight text-white font-display font-bold mb-[4vh]">Earn your team rank</h1>
        <div className="bg-panel border border-white/10 rounded-[0.5vw] px-[2vw] py-[1vh]">
<p className="flex justify-between gap-[2vw] text-[2vw] leading-[1.35] py-[2.5vh] border-b border-white/10 last:border-0" data-copy><span className="text-white">Rookie Detectives:</span>{' '}<span className="font-mono text-primary text-right">below 50 points</span></p>
<p className="flex justify-between gap-[2vw] text-[2vw] leading-[1.35] py-[2.5vh] border-b border-white/10 last:border-0" data-copy><span className="text-white">Junior Investigators:</span>{' '}<span className="font-mono text-primary text-right">50–74 points</span></p>
<p className="flex justify-between gap-[2vw] text-[2vw] leading-[1.35] py-[2.5vh] border-b border-white/10 last:border-0" data-copy><span className="text-white">Senior Investigators:</span>{' '}<span className="font-mono text-primary text-right">75–99 points</span></p>
<p className="flex justify-between gap-[2vw] text-[2vw] leading-[1.35] py-[2.5vh] border-b border-white/10 last:border-0" data-copy><span className="text-white">Elite Detectives:</span>{' '}<span className="font-mono text-primary text-right">100–129 points</span></p>
<p className="flex justify-between gap-[2vw] text-[2vw] leading-[1.35] py-[2.5vh] border-b border-white/10 last:border-0" data-copy><span className="text-accent font-bold">Master Detectives:</span>{' '}<span className="font-mono text-accent text-right">130+ points</span></p>
        </div>
        <p className="text-[2vw] leading-[1.35] mt-[3vh] text-muted" data-copy>Balance confident deduction against the value of unused actions</p>
        <footer className="mt-auto pt-[2vh] text-right text-[1.5vw] text-muted">BDS Case Files</footer>
      </main>
    </div>
  );
}
