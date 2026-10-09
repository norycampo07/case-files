import { motion } from 'framer-motion';
import { SceneFrame, Reveal, useBeats } from '../SceneFrame';

const agents = [
  { name: 'AM', x: 2, y: 7, endX: 10, endY: 20 },
  { name: 'JL', x: 79, y: 7, endX: 87, endY: 20 },
  { name: 'RK', x: 0, y: 67, endX: 9, endY: 78 },
  { name: 'TS', x: 81, y: 67, endX: 90, endY: 78 },
  { name: 'DN', x: 41, y: 0, endX: 50, endY: 14 },
];
export function Scene2() {
  const beat = useBeats([500,1000,1500,2000,2500,3200]);
  return <SceneFrame scene="team" endAt={3200}>
    <div className="team-heading"><Reveal><h2>Assemble your agency.</h2></Reveal></div>
    <Reveal className="team-count gold" delay={.3}>2–10 PLAYERS</Reveal>
    <motion.div className="network" animate={{ scale: beat >= 6 ? 1.12 : 1 }}>
      <svg className="network-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
        {agents.map((a,i) => <motion.path key={a.name} d={`M 50 51 L ${a.endX} ${a.endY}`} fill="none" stroke="#d7b66c" strokeWidth=".22"
          initial={{ pathLength: 0 }} animate={{ pathLength: beat > i ? 1 : 0 }} transition={{ duration: .45 }} />)}
      </svg>
      <motion.div className="network-hub" animate={{ scale: beat >= 5 ? [1,1.04,1] : 1 }} transition={{ duration: .6 }}>
        <p className="label">ROOM CODE</p><strong>BDS724</strong>
      </motion.div>
      {agents.map((a,i) => <motion.div key={a.name} className="agent" style={{ left: `${a.x}%`, top: `${a.y}%` }}
        initial={{ scale: .4, opacity: .15 }} animate={{ scale: beat > i ? 1 : .4, opacity: beat > i ? 1 : .15 }}
        transition={{ type: 'spring', stiffness: 360, damping: 25 }}>
        <div className="initials">{a.name}</div><div><div className="online-dot"/><small>CONNECTED</small></div>
      </motion.div>)}
    </motion.div>
  </SceneFrame>;
}
