const base = import.meta.env.BASE_URL;
export default function Slide01() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text font-body flex">
      <aside className="w-[22vw] shrink-0 border-r border-white/5 px-[3vw] py-[5vh] flex flex-col">
        <div className="flex items-center gap-[1vw] mb-[6vh]"><span className="w-[1.5vw] h-[1.5vw] bg-primary rounded-[0.25vw]" /><p className="text-white font-bold text-[1.5vw]">BDS Case Files</p></div>
        <p className="text-muted text-[1.5vw] uppercase tracking-wide mb-[2vh]">Getting started</p>
        <div className="space-y-[2vh] text-[1.5vw] mb-[5vh]"><p className="text-primary font-bold">Overview</p><p className="text-muted">Safe play</p><p className="text-muted">Room setup</p></div>
        <p className="text-muted text-[1.5vw] uppercase tracking-wide mb-[2vh]">Playing a case</p>
        <div className="space-y-[2vh] text-[1.5vw]"><p className="text-muted">Investigation</p><p className="text-muted">Resolution</p><p className="text-muted">Replay</p></div>
        <p className="mt-auto text-[1.5vw] font-mono text-muted">01 / 12</p>
      </aside>
      <main className="flex-1 min-w-0 px-[6vw] pt-[8vh] pb-[6vh] flex flex-col">
        <p className="text-primary text-[1.5vw] font-bold uppercase tracking-wide mb-[2vh]">Game mechanics</p>
        <h1 className="text-[4.5vw] leading-[1.1] tracking-tight text-white font-display font-bold mb-[2vh]">BDS Case Files</h1>
        <p className="text-[2vw] leading-[1.5] text-muted max-w-[48vw] mb-[5vh]" data-copy>Cooperative workplace mysteries</p>
        <p className="font-mono text-[2vw] leading-[1.35] bg-accent/10 border border-accent/20 rounded-[0.5vw] py-[2vh] px-[2vw] text-accent mb-[4vh] w-fit" data-copy>2–10 players • 5 specialist roles • 6 team actions</p>
        <div className="grid grid-cols-2 gap-[4vw] items-stretch">
          <div>
            <p className="text-[2vw] text-white font-bold pb-[1.5vh] mb-[2vh] border-b border-white/10">Objective:</p>
            <div className="bg-panel border border-white/5 rounded-[0.5vw] px-[2vw] py-[3vh] min-h-[24vh]">
              <p className="text-[2vw] leading-[1.5]" data-copy>identify the suspect, motive, and method</p>
            </div>
          </div>
          <div className="bg-panel border border-white/5 rounded-[0.5vw] overflow-hidden h-[33vh] flex items-center justify-center">
            <img src={base + "case-file.png"} crossOrigin="anonymous" alt="A fictional workplace case folder with blank papers and a magnifying glass" className="w-full h-full object-contain p-[1vw]" />
          </div>
        </div>
        <footer className="mt-auto pt-[2vh] text-right text-[1.5vw] text-muted">BDS Case Files</footer>
      </main>
    </div>
  );
}
