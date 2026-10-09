import { motion } from 'framer-motion';
import { FileSpreadsheet, Search } from 'lucide-react';
import { SceneFrame, Reveal, useBeats, EASE } from '../SceneFrame';

export function Scene1() {
  const beat = useBeats([1000, 1500, 2500, 3300]);
  return <SceneFrame scene="opening" endAt={3300}>
    <div className="rules" />
    <div className="scene-number">01 / THE CASE</div>
    <div className="opening-copy">
      <motion.div className="label gold" animate={{ opacity: beat < 1 ? 1 : .45 }}>A NEW CASE.</motion.div>
      <h1 className="serif"><Reveal delay={.5}>BDS</Reveal><span><Reveal delay={1}>Case Files</Reveal></span></h1>
      <Reveal delay={1.5}><p className="caption">Your team. One mystery.</p></Reveal>
      <Reveal delay={2}><p className="caption gold">Fictional workplace mysteries</p></Reveal>
    </div>
    <motion.div className="folder" initial={{ rotate: -8, scale: .94 }} animate={{ rotate: beat >= 4 ? 0 : -3, scale: beat >= 4 ? 1.25 : 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}>
      <div className="folder-back" /><div className="folder-tab">CASE / 001</div>
      <div className="folder-sheet"><p className="label">PROJECT OFFICE</p><h3>Missing tracker.</h3><FileSpreadsheet />
        <div className="paper-lines">{[0,1,2,3].map(i => <motion.i key={i} initial={{ scaleX: .3 }} animate={{ scaleX: beat >= 3 ? 1 : .3 }} transition={{ delay: i * .08 }}/>)}</div>
      </div>
      <motion.div className="folder-cover" animate={{ rotateY: beat >= 2 ? -115 : 0, opacity: beat >= 2 ? 0 : 1 }}
        transition={{ duration: .85, ease: EASE }}>
        <p className="label">BDS / INVESTIGATIONS</p><div className="mark">Case 001.</div>
        <p className="label">PROJECT OFFICE · TRACKER</p><div className="cover-rule"/><div className="round-stamp"><Search /></div>
      </motion.div>
    </motion.div>
  </SceneFrame>;
}
