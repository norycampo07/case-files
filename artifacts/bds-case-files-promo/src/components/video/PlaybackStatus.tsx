import { useEffect, useRef, useState } from 'react';

const format = (ms: number) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2,'0')}`;
export function PlaybackStatus({ sceneKeys, activeIndex, activeDuration, activeStartTime, totalDuration, tick, paused, onJumpTo }: {
  sceneKeys: string[]; activeIndex: number; activeDuration: number; activeStartTime: number;
  totalDuration: number; tick: number; paused: boolean; onJumpTo: (i: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const base = useRef(0);
  useEffect(() => { base.current = 0; setElapsed(0); }, [tick]);
  useEffect(() => {
    if (paused) return;
    const start = performance.now();
    const timer = window.setInterval(() => setElapsed(base.current + performance.now() - start),60);
    return () => { window.clearInterval(timer); base.current += performance.now() - start; };
  }, [tick,paused]);
  const progress = Math.min(1,elapsed / activeDuration);
  const totalElapsed = Math.min(totalDuration,activeStartTime + Math.min(elapsed,activeDuration));
  return <>
    <div className="segments">{sceneKeys.map((key,i) => <button key={key} aria-label={`Jump to scene ${i+1}`} aria-current={i===activeIndex?'true':undefined} onClick={() => onJumpTo(i)}>
      <span style={{ width: `${i===activeIndex?progress*100:0}%` }}/>
    </button>)}</div>
    <div className="control-count">{activeIndex+1}/{sceneKeys.length}</div>
    <div className="control-time" role="timer" aria-label={`Playback time ${format(totalElapsed)} of ${format(totalDuration)}`}>{format(totalElapsed)} / {format(totalDuration)}</div>
  </>;
}
