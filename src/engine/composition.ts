import { createRng } from '../vendor/pigment-drift/engine/params';
import { SHEETS } from './layout';
import { gnoise } from '../vendor/pigment-drift/paint/noise';
import type { Composition, EngineSettings, Gesture, GestureKind, Point } from './types';
/** Default sheet for tools using the free composition API. */
export const SHEET = SHEETS.landscape;
export const TICK_RATE = 30;
export const DURATION = 24;
export const clamp=(v:number,min=0,max=1)=>Math.min(max,Math.max(min,v));

/** Uniformly sampled Catmull–Rom gesture. This is a path, never a final painted mask. */
export function curve(pts: Point[],samples=80,margin=.09): Point[] {
  return Array.from({length:samples},(_,i)=>{
    const q=i/(samples-1)*(pts.length-1), k=Math.min(pts.length-2,Math.floor(q)),t=q-k;
    const a=pts[Math.max(0,k-1)],b=pts[k],c=pts[k+1],d=pts[Math.min(pts.length-1,k+2)];
    const axis=(axis:'x'|'y')=>clamp(.5*((2*b[axis])+(-a[axis]+c[axis])*t+(2*a[axis]-5*b[axis]+4*c[axis]-d[axis])*t*t+(-a[axis]+3*b[axis]-3*c[axis]+d[axis])*t*t*t),margin,1-margin);
    return {x:axis('x'),y:axis('y')};
  });
}

/** Five structural families. Foci, a counterweight and a protected void precede details. */
export function compose(seed:number,settings:EngineSettings): Composition {
  seed=seed>>>0;
  const rand=createRng(seed), between=(a:number,b:number)=>a+(b-a)*rand();
  const family=seed%5, mirror=rand()>.5;
  const structures:Point[][][]=[
    [[{x:.19,y:.62},{x:.35,y:.48},{x:.52,y:.52},{x:.76,y:.30}], [{x:.37,y:.66},{x:.53,y:.64},{x:.71,y:.49}]],
    [[{x:.23,y:.44},{x:.34,y:.32},{x:.48,y:.43}], [{x:.55,y:.59},{x:.68,y:.52},{x:.77,y:.66}]],
    [[{x:.46,y:.19},{x:.39,y:.40},{x:.53,y:.57},{x:.43,y:.77}], [{x:.62,y:.33},{x:.67,y:.43},{x:.61,y:.58}]],
    [[{x:.22,y:.30},{x:.37,y:.37},{x:.43,y:.59},{x:.34,y:.72}], [{x:.59,y:.28},{x:.61,y:.52},{x:.75,y:.64}]],
    [[{x:.18,y:.44},{x:.40,y:.33},{x:.60,y:.41},{x:.79,y:.37}], [{x:.28,y:.62},{x:.46,y:.66},{x:.71,y:.55}]],
  ];
  const titles=['L’estuaire intérieur','Les îles silencieuses','Ce qui prend racine','Le passage de l’eau','La mémoire des strates'];
  const offset={x:between(-.025,.025),y:between(-.045,.045)};
  const paths=structures[family].map(ps=>ps.map(p=>({x:(mirror?1-p.x:p.x)+offset.x,y:p.y+offset.y})));
  const gestures:Gesture[]=[];
  const add=(kind:GestureKind,start:number,duration:number,pts:Point[],radius:number,load:number,ink:number,flow=0)=>{
    gestures.push({kind,start,duration,points:curve(pts),radius,load,ink,flow,phase:between(0,100)});
  };
  const density=clamp(settings.complexity);
  // Broad, dilute grounds leave a generous untouched margin.
  paths.forEach((path,i)=>{
    add('water',.1+i*.55,1.5,path,.16+between(-.02,.03),.55,0);
    add('wash',.65+i*1.2,2.6,path,.14+between(-.02,.02),.37+between(0,.10),i, .04);
  });
  const count=3+Math.round(density*7);
  for(let i=0;i<count;i++){
    const group=i%2,main=paths[group];
    const dx=between(-.065,.065),dy=between(-.085,.085);
    const ps=main.map(p=>({x:p.x+dx+between(-.018,.018),y:p.y+dy+between(-.018,.018)}));
    const ink=i<2?i:rand()<.66?group:2;
    const radius=between(.05,.10)*(1-.2*i/count);
    add(i<2?'deposit':'wash',2.1+i*.65,between(1.5,2.4),ps,radius,between(.48,.84),ink,.05+settings.wetness*.13);
  }
  // Smaller mineral deposits sit within existing washes, not over the whole page.
  const details=3+Math.round(density*8);
  for(let i=0;i<details;i++){
    const path=paths[i%2], p=path[Math.floor(between(0,path.length))];
    const a={x:p.x+between(-.05,.05),y:p.y+between(-.035,.035)};
    const b={x:a.x+between(-.035,.035),y:a.y+between(.006,.04)};
    add('deposit',5+i*.42,between(.35,.7),[a,b],between(.019,.047),between(.70,.96),i%3);
  }
  // A short wet crossing allows the two color families to meet.
  const a=paths[0][Math.floor(paths[0].length/2)],b=paths[1][0];
  add('meeting',8.4,1.5,[a,{x:(a.x+b.x)/2+.02,y:(a.y+b.y)/2},b],.038,.28,2,.20+settings.wetness*.35);
  // Gravity follows several fine tributaries, tapering down the sheet.
  const runs=2+Math.round(density*3);
  for(let i=0;i<runs;i++){
    const root=paths[i%2][Math.floor(rand()*paths[i%2].length)];
    const len=between(.06,.16), dx=between(-.025,.025);
    const ps=Array.from({length:6},(_,j)=>({x:root.x+dx*j/5+.008*gnoise(j*.8,seed%100),y:clamp(root.y+len*j/5,.12,.88)}));
    add('run',8.9+i*.4,1.8,ps,between(.003,.008),between(.32,.56),i%3,.20);
  }
  // Secondary branches share a root and a direction, rather than random confetti.
  for(let i=0;i<Math.round(4+density*12);i++){
    const root=paths[i%2][Math.floor(rand()*paths[i%2].length)];
    const side=rand()<.5?-1:1, len=between(.025,.08), y=root.y+between(-.035,.035);
    add('run',9.2+i*.17,between(.55,1.1),[
      {x:root.x,y},{x:root.x+side*len*.4,y:y-.012},{x:root.x+side*len,y:y+between(-.035,.035)}
    ],between(.0018,.004),between(.25,.46),i%3,.03);
  }
  // Fresh water enters a partly dry wash: irregular backruns, no concentric rings.
  for(let i=0;i<3+Math.round(density*3);i++){
    const path=paths[i%2],p=path[Math.floor(rand()*path.length)];
    const x=p.x+between(-.025,.025),y=p.y+between(-.025,.025);
    add('bloom',11.7+i*.5,.85,[{x,y},{x:x+.003,y:y+.003}],between(.010,.022),.45,0);
  }
  // A restrained lifted accent keeps a little light inside the denser mass.
  const p=paths[0][1];
  add('lift',14.1,1.1,[{x:p.x-.025,y:p.y+.016},{x:p.x+.045,y:p.y-.01}],.006,.52,0);
  gestures.sort((a,b)=>a.start-b.start);
  return {title:titles[family],gestures,duration:DURATION,seed};
}

/** Deterministic time sampling. All physical steps use this same clock. */
export function sampleGesture(g:Gesture,t:number): {a:Point;b:Point;radius:number;progress:number} {
  const u=clamp((t-g.start)/g.duration), prev=clamp((t-1/TICK_RATE-g.start)/g.duration);
  const at=(v:number)=>{const p=v*(g.points.length-1),i=Math.min(g.points.length-2,Math.floor(p)),f=p-i;return {x:g.points[i].x+(g.points[i+1].x-g.points[i].x)*f,y:g.points[i].y+(g.points[i+1].y-g.points[i].y)*f};};
  const envelope=g.kind==='run' ? .9-.75*u : .48+.52*Math.sin(Math.PI*u)**.65;
  const irregular=1+.52*gnoise(u*7,g.phase)+.28*gnoise(u*19,g.phase+7.5);
  return {a:at(prev),b:at(u),radius:g.radius*envelope*irregular,progress:u};
}
