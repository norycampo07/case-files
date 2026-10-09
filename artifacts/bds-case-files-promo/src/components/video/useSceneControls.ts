import { useCallback, useMemo, useState } from 'react';

export const stripRepeatSuffix = (key: string) => key.replace(/_r[12]$/, '');
export function useSceneControls(baseDurations: Record<string, number>) {
  const sceneKeys = useMemo(() => Object.keys(baseDurations), [baseDurations]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [locked, setLocked] = useState(false);
  const [paused, setPaused] = useState(false);
  const [mountKey, setMountKey] = useState(0);
  const [tick, setTick] = useState(0);
  const durations = useMemo(() => {
    const key = sceneKeys[activeIndex];
    if (locked) return { [`${key}_r1`]: baseDurations[key], [`${key}_r2`]: baseDurations[key] };
    const out: Record<string, number> = {};
    for (let i = 0; i < sceneKeys.length; i++) {
      const k = sceneKeys[(activeIndex + i) % sceneKeys.length];
      out[k] = baseDurations[k];
    }
    return out;
  }, [locked, activeIndex, sceneKeys, baseDurations]);
  const onSceneChange = useCallback((rawKey: string) => {
    const index = sceneKeys.indexOf(stripRepeatSuffix(rawKey));
    if (index >= 0) setActiveIndex(index);
    setTick(t => t + 1);
  }, [sceneKeys]);
  const jumpTo = useCallback((index: number) => {
    setActiveIndex(index); setPaused(false); setMountKey(k => k + 1); setTick(t => t + 1);
  }, []);
  const toggleLock = useCallback(() => {
    setLocked(l => !l); setPaused(false); setMountKey(k => k + 1); setTick(t => t + 1);
  }, []);
  return {
    sceneKeys, activeIndex, locked, paused, mountKey, tick, durations, onSceneChange, jumpTo, toggleLock,
    togglePause: () => setPaused(p => !p),
    activeDuration: baseDurations[sceneKeys[activeIndex]] ?? 0,
    activeStartTime: sceneKeys.slice(0, activeIndex).reduce((sum, key) => sum + baseDurations[key], 0),
    totalDuration: Object.values(baseDurations).reduce((sum, ms) => sum + ms, 0),
  };
}
