import { useEffect, useState } from "react";

export const TEAM_COLORS = ["hsl(7 82% 50%)", "hsl(178 70% 30%)", "hsl(262 55% 50%)", "hsl(32 90% 42%)", "hsl(100 45% 32%)"];
export const teamColor = (id: number) => TEAM_COLORS[id % TEAM_COLORS.length];

export function Portrait({ src, name, className = "" }: { src: string; name: string; className?: string }) {
  const isImg = /^(https?:|\/|data:|blob:)/.test(src || "");
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return isImg ? <img src={src} alt={name} className={"object-cover " + className} /> :
    <div className={"grid place-items-center font-display font-bold text-foreground bg-secondary " + className}>{initials}</div>;
}

export function useCountdown(deadline: number | null | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!deadline) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [deadline]);
  return deadline ? Math.max(0, Math.ceil((deadline - now) / 1000)) : null;
}

export function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => i);
  return <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden z-30">{pieces.map((i) => (
    <span key={i} className="confetti" style={{
      position: "absolute",
      left: `${(i * 37) % 100}%`, background: TEAM_COLORS[i % 5],
      animationDuration: `${3 + (i % 7) * 0.5}s`, animationDelay: `${(i % 10) * -0.6}s`,
      ["--dx" as string]: `${((i % 9) - 4) * 30}px`,
    } as React.CSSProperties} />
  ))}</div>;
}
