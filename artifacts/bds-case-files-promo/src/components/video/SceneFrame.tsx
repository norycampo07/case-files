import { motion } from 'framer-motion';
import { useState, type PropsWithChildren } from 'react';
import { useSceneTimer } from '@/lib/video';

export const EASE = [0.22, 1, 0.36, 1] as const;

export function useBeats(times: number[]) {
  const [beat, setBeat] = useState(0);
  useSceneTimer(times.map((time, i) => ({ time, callback: () => setBeat(i + 1) })));
  return beat;
}

export function SceneFrame({ children, className = '', endAt, kind = 'push', scene }: PropsWithChildren<{
  className?: string; endAt: number; kind?: 'push' | 'fold' | 'pull'; scene: string;
}>) {
  const leaving = useBeats([endAt]) > 0;
  return (
    <motion.section
      data-scene={scene}
      className={`shot ${className}`}
      initial={{ opacity: 1, scale: 1.12, rotate: -.8 }}
      animate={{ scale: leaving ? (kind === 'pull' ? .98 : 1.03) : 1, rotate: leaving ? .4 : 0 }}
      exit={{ opacity: 0, scale: kind === 'fold' ? .97 : 1.05, rotate: .7, transition: { duration: .4 } }}
      transition={{ duration: leaving ? .7 : .65, ease: EASE }}
    >{children}</motion.section>
  );
}

export function Reveal({ children, delay = 0, className = '' }: PropsWithChildren<{ delay?: number; className?: string }>) {
  return <motion.div className={className} initial={{ clipPath: 'inset(0 0 100% 0)', y: 12 }}
    animate={{ clipPath: 'inset(0 0 0% 0)', y: 0 }} transition={{ delay, duration: .55, ease: EASE }}>{children}</motion.div>;
}
