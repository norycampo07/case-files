import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Pause, Play, Repeat, Volume2, VolumeX } from 'lucide-react';
import VideoTemplate, { SCENE_DURATIONS } from './VideoTemplate';
import { useSceneControls } from './useSceneControls';
import { PlaybackStatus } from './PlaybackStatus';
import { SCENE_DETAILS } from './sceneMeta';

export default function VideoWithControls() {
  const isIframed = typeof window !== 'undefined' && window.self !== window.top;
  const controls = useSceneControls(SCENE_DURATIONS);
  const [muted,setMuted] = useState(false);
  const [collapsed,setCollapsed] = useState(false);
  const [hovering,setHovering] = useState(false);
  const [tapPinned,setTapPinned] = useState(false);
  const sensor = useRef<HTMLDivElement>(null);
  const { paused, locked, mountKey, durations, onSceneChange, jumpTo, toggleLock, togglePause, sceneKeys } = controls;
  const handleJump = useCallback((index: number) => {
    jumpTo(index);
    const details = SCENE_DETAILS[sceneKeys[index]];
    if (details?.filePath) window.parent.postMessage({ type:'REPLIT_VIDEO_SCENE_SELECTED', payload:{
      sceneIndex:index,sceneCount:sceneKeys.length,sceneTitle:details.title,filePath:details.filePath,lineNumber:1,
    } },'*');
  }, [jumpTo,sceneKeys]);
  useEffect(() => {
    if (!paused) return;
    const frozen = document.getAnimations().filter(a => a.playState==='running');
    frozen.forEach(a => a.pause());
    return () => frozen.forEach(a => a.play());
  },[paused]);
  useEffect(() => {
    if (!(collapsed && tapPinned)) return;
    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' && !sensor.current?.contains(event.target as Node)) setTapPinned(false);
    };
    document.addEventListener('pointerdown',onDown);
    return () => document.removeEventListener('pointerdown',onDown);
  },[collapsed,tapPinned]);
  if (!isIframed) return <VideoTemplate/>;
  const visible = !collapsed || hovering || tapPinned;
  return <div style={{ position:'relative',height:'100vh' }}>
    <VideoTemplate key={mountKey} durations={durations} loop paused={paused} muted={muted} onSceneChange={onSceneChange}/>
    <div className="control-sensor" ref={sensor}
      onPointerEnter={e => { if(e.pointerType==='mouse') setHovering(true); }}
      onPointerLeave={e => { if(e.pointerType==='mouse') setHovering(false); }}
      onPointerDown={e => { if(e.pointerType!=='mouse' && collapsed) setTapPinned(true); }}>
      <div style={{ flex:1 }} aria-hidden="true"/>
      <div className={`control-bar ${visible?'':'hidden-bar'}`} aria-hidden={!visible}>
        <button className="control-button" aria-label={paused?'Play':'Pause'} title={paused?'Play':'Pause'} onClick={togglePause}>{paused?<Play/>:<Pause/>}</button>
        <button className={`control-button ${locked?'active':''}`} aria-label="Loop current scene" aria-pressed={locked} title="Loop current scene" onClick={toggleLock}><Repeat/></button>
        <button className="control-button" aria-label={muted?'Unmute audio':'Mute audio'} title={muted?'Unmute audio':'Mute audio'} onClick={() => setMuted(m => !m)}>{muted?<VolumeX/>:<Volume2/>}</button>
        <div className="control-divider"/>
        <PlaybackStatus {...controls} onJumpTo={handleJump}/>
        <button className="control-button" aria-label={collapsed?'Show controls':'Hide controls'} aria-expanded={!collapsed}
          onClick={() => { setCollapsed(c => !c); setHovering(false); setTapPinned(false); }}>{collapsed?<ChevronUp/>:<ChevronDown/>}</button>
      </div>
    </div>
  </div>;
}
