import {useEffect,useState} from 'react';
export const POETRY_FONT='"Special Elite"';
export const POETRY_COLOR='#35483e';
export const POETRY_LINE_HEIGHT=1.5;
/** The same width-fitting rule is used on paper and in the full-resolution PNG. */
export function fixedPoetryLayout(measure:(text:string,size:number)=>number,title:string,verses:readonly string[],ratio=1400/1980){
 const fit=(lines:readonly string[],size:number)=>size*Math.min(1,.88/Math.max(.001,...lines.map(line=>measure(line,size))));
 const titleSize=fit([title],.048),verseSize=fit(verses,.041);
 return {titleSize,verseSize,titleY:.045,verseY:.92-verses.length*verseSize*POETRY_LINE_HEIGHT*ratio};
}
export async function loadPoetryFont(){await document.fonts?.load(`20px ${POETRY_FONT}`);await document.fonts?.ready;}
export function FixedPoetry({title,verses,ratio=1400/1980}:{title:string;verses:readonly string[];ratio?:number}){
 const [layout,setLayout]=useState(()=>fixedPoetryLayout(()=>0,title,verses,ratio));
 useEffect(()=>{let alive=true;void loadPoetryFont().then(()=>{
  const ctx=document.createElement('canvas').getContext('2d');if(!ctx||!alive)return;
  setLayout(fixedPoetryLayout((text,size)=>{ctx.font=`${size*1000}px ${POETRY_FONT}`;return ctx.measureText(text).width/1000;},title,verses,ratio));
 }).catch(()=>{});return()=>{alive=false;};},[title,verses,ratio]);
 return <><div className="resonant-title fixed-poetry" style={{top:`${layout.titleY*100}%`,fontSize:`${layout.titleSize*100}cqw`}} aria-label="Titre du haïku">{title}</div><div className="resonant-haiku fixed-poetry" style={{top:`${layout.verseY*100}%`,fontSize:`${layout.verseSize*100}cqw`}} aria-label="Haïku résonant">{verses.map((line,i)=><span key={i}>{line}</span>)}</div></>;
}
