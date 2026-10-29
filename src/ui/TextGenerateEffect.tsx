import {PoeticMotion} from './PoeticMotion';
import {i as MotionWord} from 'motion/react-m';
import {useMediaPreference} from './useMediaPreference';
import './poetic-ui.css';
/** Word-by-word revelation preserves whitespace and keeps the full text accessible immediately. */
export function TextGenerateEffect({text,delay=0}:{text:string;delay?:number}){
 const reduced=useMediaPreference('(prefers-reduced-motion: reduce)');let word=0;
 return <PoeticMotion><span className="poetic-text">{text.split(/(\s+)/).map((part,i)=>/\s+/.test(part)?part:<MotionWord className="poetic-word" key={i} initial={reduced?false:{opacity:0,y:2}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:1.15,delay:reduced?0:delay+Math.min(word++*.10,1.8),ease:'easeOut'}}>{part}</MotionWord>)}</span></PoeticMotion>;
}
