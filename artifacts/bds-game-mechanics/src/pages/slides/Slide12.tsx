export default function Slide12() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg text-text font-body">
      <main className="h-full px-[8vw] pt-[6vh] pb-[5vh] flex flex-col bg-[radial-gradient(ellipse_at_top,rgba(122,162,247,0.07),transparent_70%)]">
        <p className="text-primary text-[1.5vw] font-bold uppercase tracking-wide mb-[2vh]">Game mechanics</p>
        <h1 className="text-[4vw] leading-[1.1] text-white font-display font-bold tracking-tight mb-[4vh]">Host controls and replay</h1>
        <div className="grid grid-cols-2 gap-x-[3vw] gap-y-[2vh]">
          <div className="bg-panel border border-white/10 rounded-[0.5vw] px-[2vw] py-[3vh]"><p className="text-[2vw] leading-[1.4] text-primary" data-copy>Disable rumors to hide playful leads</p></div>
<div className="bg-panel border border-white/10 rounded-[0.5vw] px-[2vw] py-[3vh]"><p className="text-[2vw] leading-[1.4] text-primary" data-copy>Disable chat to stop discussion and discard existing messages</p></div>
<div className="bg-panel border border-white/10 rounded-[0.5vw] px-[2vw] py-[3vh]"><p className="text-[2vw] leading-[1.4] text-accent" data-copy>Reset Case clears the case and returns the same team to the lobby</p></div>
<div className="bg-panel border border-white/10 rounded-[0.5vw] px-[2vw] py-[3vh]"><p className="text-[2vw] leading-[1.4] text-accent" data-copy>Start New Case replaces the case while keeping the room, team, and settings</p></div>
        </div>
        <p className="text-[2vw] text-gold leading-[1.35] mt-[3vh]" data-copy>Both actions discard previous evidence, chat, notes, votes, and results</p>
        <p className="font-mono text-[2vw] leading-[1.4] text-accent mt-[3vh] py-[2vh] border-t border-white/10" data-copy>Repeat: Brief → Discuss → Vote → Investigate → Accuse → Reveal</p>
        <footer className="mt-auto pt-[2vh] text-[1.5vw] text-muted flex justify-between"><p>BDS Case Files</p><p className="font-mono">12 / 12</p></footer>
      </main>
    </div>
  );
}
