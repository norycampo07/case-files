export default function Slide04() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text font-body flex">
      <aside className="w-[22vw] shrink-0 border-r border-white/5 px-[3vw] py-[5vh] flex flex-col">
        <div className="flex items-center gap-[1vw] mb-[6vh]"><span className="w-[1.5vw] h-[1.5vw] bg-primary rounded-[0.25vw]" /><p className="text-white font-bold text-[1.5vw]">BDS Case Files</p></div>
        <p className="text-muted text-[1.5vw] uppercase tracking-wide mb-[2vh]">Getting started</p>
        <div className="space-y-[2vh] text-[1.5vw] mb-[5vh]"><p className="text-muted">Overview</p><p className="text-muted">Safe play</p><p className="text-muted">Room setup</p></div>
        <p className="text-muted text-[1.5vw] uppercase tracking-wide mb-[2vh]">Playing a case</p>
        <div className="space-y-[2vh] text-[1.5vw]"><p className="text-primary font-bold">Investigation</p><p className="text-muted">Resolution</p><p className="text-muted">Replay</p></div>
        <p className="mt-auto text-[1.5vw] font-mono text-muted">04 / 12</p>
      </aside>
      <main className="flex-1 min-w-0 px-[6vw] pt-[7vh] pb-[5vh] flex flex-col">
        <p className="text-primary text-[1.5vw] font-bold uppercase tracking-wide mb-[2vh]">Game mechanics</p>
        <h1 className="text-[3.8vw] leading-[1.1] tracking-tight text-white font-display font-bold mb-[4vh]">Read the case briefing</h1>
        <div className="grid grid-cols-[1.15fr_1fr] gap-[3vw]">
          <div className="space-y-[2vh]"><div className="flex gap-[1.5vw] items-start py-[1.25vh] border-b border-white/10 ">
            <span className="text-primary font-mono text-[1.5vw] pt-[0.5vh] w-[2.5vw] shrink-0">01</span>
            <p className="text-[2vw] leading-[1.3] text-text" data-copy>Review the case title, summary, and location</p>
          </div><div className="flex gap-[1.5vw] items-start py-[1.25vh] border-b border-white/10 ">
            <span className="text-primary font-mono text-[1.5vw] pt-[0.5vh] w-[2.5vw] shrink-0">02</span>
            <p className="text-[2vw] leading-[1.3] text-text" data-copy>Meet six fictional suspects and compare their profiles and alibis</p>
          </div><div className="flex gap-[1.5vw] items-start py-[1.25vh] border-b border-white/10 ">
            <span className="text-primary font-mono text-[1.5vw] pt-[0.5vh] w-[2.5vw] shrink-0">03</span>
            <p className="text-[2vw] leading-[1.3] text-text" data-copy>Start with two evidence items and the case timeline</p>
          </div></div>
          <div className="space-y-[3vh]"><div className="bg-panel border border-white/10 rounded-[0.5vw] px-[2vw] py-[3vh]"><p className="text-[2vw] leading-[1.4] text-accent" data-copy>Read 2–4 playful rumors when enabled</p></div><div className="bg-panel border border-white/10 rounded-[0.5vw] px-[2vw] py-[3vh]"><p className="text-[2vw] leading-[1.4] text-gold" data-copy>Treat rumors as leads—not proof</p></div></div>
        </div>
        <footer className="mt-auto pt-[2vh] text-right text-[1.5vw] text-muted">BDS Case Files</footer>
      </main>
    </div>
  );
}
