import { motion } from 'framer-motion';
import { Fingerprint, MessageCircle, BookOpen, ChartNoAxesCombined, Brain } from 'lucide-react';
import { SceneFrame, Reveal, useBeats, EASE } from '../SceneFrame';

const roles = [
  { title: 'Profiler', Icon: Brain }, { title: 'Analyst', Icon: ChartNoAxesCombined },
  { title: 'Archivist', Icon: BookOpen }, { title: 'Interviewer', Icon: MessageCircle },
  { title: 'Forensics', Icon: Fingerprint },
];
export function Scene4() {
  const beat = useBeats([700,1400,2100,2800,3000,4000]);
  return <SceneFrame scene="roles" endAt={4000} kind="fold">
    <div className="rules"/>
    <div className="role-copy"><p className="label gold">FIVE SPECIALIST ROLES</p>
      <h2><Reveal>Different roles.</Reveal><span><Reveal delay={.8}>Shared answers.</Reveal></span></h2>
    </div>
    <motion.div className="roles-world" animate={{ scale: beat >= 6 ? .93 : 1 }} transition={{ duration: .7 }}>
      {roles.map(({ title, Icon },i) => {
        const order = 4-i;
        return <motion.div className={`role-file ${i === 4 ? 'first' : ''}`} key={title} style={{ zIndex: i }}
          initial={{ rotate: -3, opacity: i === 4 ? 1 : 0 }}
          animate={{ rotate: beat >= order ? (4-i) * 9 - 10 : -3, opacity: beat >= order ? 1 : 0 }}
          transition={{ duration: .55, ease: EASE }}>
          {i === 4 && <p className="role-title">{title}</p>}<Icon /><div className="paper-lines"><i/><i/><i/></div>
        </motion.div>;
      })}
      <div className="role-spines">
        {roles.slice(0,4).reverse().map(({title,Icon}, i) => <motion.div className="role-spine" key={title}
          initial={{ opacity:0, rotateY:40 }} animate={{ opacity:beat >= i+1 ? 1 : 0, rotateY:beat >= i+1 ? 0 : 40 }}
          transition={{ duration:.5, ease:EASE }}><Icon/>{title}</motion.div>)}
      </div>
      <motion.div className="private-note" initial={{ rotateX: -90, opacity: 0, rotate: -4 }} animate={{ rotateX: beat >= 5 ? 0 : -90, opacity: beat >= 5 ? 1 : 0 }}
        transition={{ duration: .7, ease: EASE }}><p className="label">PRIVATE CLUE</p><p>Your expertise reveals more.</p></motion.div>
    </motion.div>
  </SceneFrame>;
}
