import {LazyMotion} from 'motion/react';
import type {ReactNode} from 'react';
const loadFeatures=()=>import('./motionFeatures').then(module=>module.default);
/** Animation features are shared and loaded separately from the initial app bundle. */
export function PoeticMotion({children}:{children:ReactNode}){return <LazyMotion features={loadFeatures} strict>{children}</LazyMotion>;}
