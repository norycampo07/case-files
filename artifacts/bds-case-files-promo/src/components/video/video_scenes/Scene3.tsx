import { motion } from 'framer-motion';
import { FileClock, Clock, Target } from 'lucide-react';
import { SceneFrame, Reveal, useBeats, EASE } from '../SceneFrame';

const clues = [
  { title: '01 / REVISION', text: 'Bekz Paras · 14:12 edit.', Icon: FileClock, left: 0, rotate: -3 },
  { title: '02 / TIMELINE', text: 'Uploaded at 14:18.', Icon: Clock, left: 35, rotate: 2 },
  { title: '03 / MOTIVE', text: 'Meet Deadline.', Icon: Target, left: 70, rotate: -2 },
];
export function Scene3() {
  const beat = useBeats([800,1500,2000,2700,3400,3800,4400,5000]);
  return <SceneFrame scene="evidence" className="evidence-shot" endAt={5000}>
    <div className="evidence-header"><h2>Follow the evidence.</h2><p className="label gold">BDS / CASE 001</p></div>
    <div className="board">
      <motion.div className="vote-slip" initial={{ scale: 1.15 }} animate={{ opacity: beat >= 3 ? 0 : 1, scale: beat >= 3 ? .65 : 1, rotateX: beat >= 3 ? 70 : 0 }} transition={{ duration: .45 }}>
        <p className="label">TEAM VOTE</p><h3>Review Project Tracker</h3><p className="caption">{beat >= 2 ? '4 / 5' : beat >= 1 ? '3 / 5' : '2 / 5'}</p>
        <div className="vote-progress"><motion.div animate={{ width: beat >= 2 ? '80%' : beat >= 1 ? '60%' : '40%' }}/></div>
      </motion.div>
      {clues.map(({title,text,Icon,left,rotate},i) => <motion.div className="clue-card" key={title} style={{ left: `${left}%`, zIndex: i+1 }}
        initial={{ opacity: 0, scale: .75, rotate: -12 }}
        animate={{ opacity: beat >= i + 3 ? 1 : 0, scale: beat >= 8 && i === 0 ? 1.1 : 1, rotate: beat >= 8 ? (i === 0 ? 0 : rotate * 4) : rotate }}
        transition={{ duration: .65, ease: EASE }}>
        <div className="pin"/><p className="label">{title}</p><Icon/><p>{text}</p>
      </motion.div>)}
      <svg className="connections" viewBox="0 0 100 100" preserveAspectRatio="none">
        <motion.path d="M 15 4 Q 33 40 49 4" fill="none" stroke="#a75043" strokeWidth=".5" initial={{ pathLength: 0 }} animate={{ pathLength: beat >= 6 ? 1 : 0 }} />
        <motion.path d="M 49 4 Q 70 48 84 4" fill="none" stroke="#a75043" strokeWidth=".5" initial={{ pathLength: 0 }} animate={{ pathLength: beat >= 7 ? 1 : 0 }} />
      </svg>
    </div>
    <Reveal delay={4} className="board-caption">Vote. Investigate. Connect.</Reveal>
  </SceneFrame>;
}
