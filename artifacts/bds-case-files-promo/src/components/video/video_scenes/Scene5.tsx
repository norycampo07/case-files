import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { SceneFrame, Reveal, useBeats, EASE } from '../SceneFrame';

export function Scene5() {
  const beat = useBeats([600,1200,2200,4500,5000,5700]);
  return <SceneFrame scene="resolution" className="outro-shot" endAt={5000} kind="pull">
    <motion.div className="accusation-sheet" initial={{ scale: 1.12, rotate: -2 }}
      animate={{ scale: beat >= 3 ? .7 : 1, opacity: beat >= 3 ? 0 : 1, rotate: 0 }} transition={{ duration: .6, ease: EASE }}>
      <p className="label">SUSPECT · MOTIVE · METHOD</p><h2>Make the accusation.</h2>
      <div className="check-row">{[0,1,2].map(i => <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: beat >= 1 ? 1 : 0 }} transition={{ delay: i*.12, type:'spring', stiffness:400, damping:20 }}><Check /></motion.div>)}</div>
    </motion.div>
    <motion.div className="case-stamp" initial={{ scale: 2, opacity: 0, rotate: -16 }}
      animate={{ scale: beat >= 3 ? .65 : beat >= 2 ? 1 : 2, opacity: beat >= 3 ? 0 : beat >= 2 ? 1 : 0, rotate: -8 }}
      transition={{ duration: .35, ease: EASE }}>CASE CLOSED</motion.div>
    <motion.div className="brand-lockup" initial={{ opacity:0, scale:.87 }}
      animate={{ opacity:beat >= 3 ? 1 : 0, scale:beat >= 5 ? .95 : 1, color:beat >= 6 ? '#f4f0e6' : '#17283d' }} transition={{ duration:.65, ease:EASE }}>
      <h1>BDS Case Files</h1><Reveal delay={3}><p>Solve it together.</p></Reveal>
      <Reveal delay={3.7}><div className="label">A MULTIPLAYER BROWSER MYSTERY</div></Reveal>
    </motion.div>
    <motion.div className="loop-cover" initial={{ scaleY:0 }} animate={{ scaleY:beat >= 6 ? 1 : 0 }} transition={{ duration:.45, ease:EASE }}/>
  </SceneFrame>;
}
