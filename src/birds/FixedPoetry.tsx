import {TextGenerateEffect} from '../ui/TextGenerateEffect';
import {useEffect,useState} from 'react';
export const POETRY_FONT='"Caveat"';
export const POETRY_OPACITY=.8;
export const POETRY_COLOR='#35483e';
export const POETRY_LINE_HEIGHT=1.5;
/** The same width-fitting rule is used on paper and in the full-resolution PNG. */
export function fixedPoetryLayout(measure:(text:string,size:number)=>number,title:string,verses:readonly string[],ratio=1400/1980){
 const fit=(lines:readonly string[],size:number)=>size*Math.min(1,.88/Math.max(.001,...lines.map(line=>measure(line,size))));
 const titleSize=Math.min(fit([title],.048),.065/(POETRY_LINE_HEIGHT*ratio)),verseSize=Math.min(fit(verses,.041),.13/(Math.max(1,verses.length)*POETRY_LINE_HEIGHT*ratio));
 return {titleSize,verseSize,titleY:.045,verseY:.81+Math.max(0,(.13-verses.length*verseSize*POETRY_LINE_HEIGHT*ratio)/2)};
}
export async function loadPoetryFont(){await document.fonts?.load(`20px ${POETRY_FONT}`);await document.fonts?.ready;}
export function FixedPoetry({title,verses,ratio=1400/1980}:{title:string;verses:readonly string[];ratio?:number}){
 const [layout,setLayout]=useState(()=>fixedPoetryLayout(()=>0,title,verses,ratio));
 useEffect(()=>{let alive=true;void loadPoetryFont().then(()=>{
  const ctx=document.createElement('canvas').getContext('2d');if(!ctx||!alive)return;
  setLayout(fixedPoetryLayout((text,size)=>{ctx.font=`${size*1000}px ${POETRY_FONT}`;return ctx.measureText(text).width/1000;},title,verses,ratio));
 }).catch(()=>{});return()=>{alive=false;};},[title,verses,ratio]);
 return <><div className="resonant-title fixed-poetry" style={{opacity:POETRY_OPACITY,top:`${layout.titleY*100}%`,fontSize:`${layout.titleSize*100}cqw`}} aria-label="Titre du haïku"><TextGenerateEffect text={title} delay={.15}/></div><div className="resonant-haiku fixed-poetry" style={{opacity:POETRY_OPACITY,top:`${layout.verseY*100}%`,fontSize:`${layout.verseSize*100}cqw`}} aria-label="Haïku résonant">{verses.map((line,i)=><TextGenerateEffect key={i} text={line} delay={.85+i*.5}/>)}</div></>;
}
