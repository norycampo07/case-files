export default function Slide02() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text font-body flex">
      <aside className="w-[22vw] shrink-0 border-r border-white/5 px-[3vw] py-[5vh] flex flex-col">
        <div className="flex items-center gap-[1vw] mb-[6vh]"><span className="w-[1.5vw] h-[1.5vw] bg-primary rounded-[0.25vw]" /><p className="text-white font-bold text-[1.5vw]">BDS Case Files</p></div>
        <p className="text-muted text-[1.5vw] uppercase tracking-wide mb-[2vh]">Getting started</p>
        <div className="space-y-[2vh] text-[1.5vw] mb-[5vh]"><p className="text-muted">Overview</p><p className="text-primary font-bold">Safe play</p><p className="text-muted">Room setup</p></div>
        <p className="text-muted text-[1.5vw] uppercase tracking-wide mb-[2vh]">Playing a case</p>
        <div className="space-y-[2vh] text-[1.5vw]"><p className="text-muted">Investigation</p><p className="text-muted">Resolution</p><p className="text-muted">Replay</p></div>
        <p className="mt-auto text-[1.5vw] font-mono text-muted">02 / 12</p>
      </aside>
      <main className="flex-1 min-w-0 px-[6vw] pt-[7vh] pb-[5vh] flex flex-col">
        <p className="text-primary text-[1.5vw] font-bold uppercase tracking-wide mb-[2vh]">Game mechanics</p>
        <h1 className="text-[3.8vw] leading-[1.1] tracking-tight text-white font-display font-bold mb-[4vh]">Keep it fictional</h1>
        <div className="space-y-[1.1vh]"><div className="flex gap-[1.5vw] items-start py-[1.25vh] border-b border-white/10 ">
            <span className="text-primary font-mono text-[1.5vw] pt-[0.5vh] w-[2.5vw] shrink-0">01</span>
            <p className="text-[2vw] leading-[1.3] text-text" data-copy>Acknowledge the fictional-entertainment notice before entering</p>
          </div>
<div className="flex gap-[1.5vw] items-start py-[1.25vh] border-b border-white/10 ">
            <span className="text-primary font-mono text-[1.5vw] pt-[0.5vh] w-[2.5vw] shrink-0">02</span>
            <p className="text-[2vw] leading-[1.3] text-text" data-copy>Use a made-up detective alias, not personal information</p>
          </div>
<div className="flex gap-[1.5vw] items-start py-[1.25vh] border-b border-white/10 ">
            <span className="text-primary font-mono text-[1.5vw] pt-[0.5vh] w-[2.5vw] shrink-0">03</span>
            <p className="text-[2vw] leading-[1.3] text-text" data-copy>All characters, clues, rumors, and outcomes are fictional</p>
          </div>
<div className="flex gap-[1.5vw] items-start py-[1.25vh] border-b border-white/10 ">
            <span className="text-primary font-mono text-[1.5vw] pt-[0.5vh] w-[2.5vw] shrink-0">04</span>
            <p className="text-[2vw] leading-[1.3] text-text" data-copy>Playful workplace mix-ups—not real incidents or allegations</p>
          </div>
<div className="flex gap-[1.5vw] items-start py-[1.25vh] border-b border-white/10 ">
            <span className="text-primary font-mono text-[1.5vw] pt-[0.5vh] w-[2.5vw] shrink-0">05</span>
            <p className="text-[2vw] leading-[1.3] text-text" data-copy>Active room state stays in memory; no database or case history</p>
          </div></div>
        <footer className="mt-auto pt-[2vh] text-right text-[1.5vw] text-muted">BDS Case Files</footer>
      </main>
    </div>
  );
}
