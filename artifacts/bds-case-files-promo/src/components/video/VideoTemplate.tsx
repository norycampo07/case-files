import { AnimatePresence, motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { VideoCanvas, VideoPausedContext, useVideoPlayer, type VideoAspectRatio } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

export const SCENE_DURATIONS = { opening: 4000, team: 4000, evidence: 6000, roles: 5000, resolution: 6000 };
const VIDEO_ASPECT_RATIO: VideoAspectRatio = '16:9';
const SCENES = { opening: Scene1, team: Scene2, evidence: Scene3, roles: Scene4, resolution: Scene5 };
const SCENE_START_SEC: Record<string, number> = {};
let cumulativeMs = 0;
for (const [key, ms] of Object.entries(SCENE_DURATIONS)) {
  SCENE_START_SEC[key] = cumulativeMs / 1000;
  cumulativeMs += ms;
}
const RING_POSES = [
  { left:'78%', top:'76%', scale:1, opacity:.55 },
  { left:'50%', top:'59%', scale:1.65, opacity:.35 },
  { left:'20%', top:'55%', scale:1.2, opacity:.2 },
  { left:'76%', top:'44%', scale:1.5, opacity:.25 },
  { left:'50%', top:'21%', scale:.7, opacity:1 },
];
export default function VideoTemplate({ durations = SCENE_DURATIONS, loop = true, paused = false, muted = false, onSceneChange }: {
  durations?: Record<string, number>; loop?: boolean; paused?: boolean; muted?: boolean; onSceneChange?: (key: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop, paused });
  useEffect(() => { onSceneChange?.(currentSceneKey); }, [currentSceneKey,onSceneChange]);
  const base = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENES;
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(base);
  const Scene = SCENES[base];
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastSceneKey = useRef<string | null>(null);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = .45;
    if (paused) { audio.pause(); return; }
    if (lastSceneKey.current !== currentSceneKey) {
      lastSceneKey.current = currentSceneKey;
      const target = SCENE_START_SEC[base] ?? 0;
      if (Math.abs(audio.currentTime - target) > .18) audio.currentTime = target;
    }
    audio.play().catch(() => {});
  }, [currentSceneKey,base,muted,paused]);
  return <VideoPausedContext.Provider value={paused}>
    <VideoCanvas aspectRatio={VIDEO_ASPECT_RATIO} className="film">
      <motion.div style={{ position:'absolute', inset:0 }} initial={false}
        animate={{ rotate: sceneIndex % 2 === 0 ? .15 : -.15 }} transition={{ duration: 2 }}>
        <AnimatePresence mode="sync">{Scene && <Scene key={currentSceneKey}/>}</AnimatePresence>
      </motion.div>
      <motion.div className="inspection-ring" initial={false} animate={{ ...RING_POSES[sceneIndex], rotate: sceneIndex * 36 }} transition={{ duration: .85 }}>
        <Search/>
      </motion.div>
      <audio ref={audioRef} src={`${import.meta.env.BASE_URL}audio/bg_music.mp3`} preload="auto" autoPlay muted={muted}/>
    </VideoCanvas>
  </VideoPausedContext.Provider>;
}
