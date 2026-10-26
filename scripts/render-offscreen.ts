/**
 * Offline QA only. Records the ACTUAL WebGL calls made by the TypeScript
 * engine, then replays those draw calls with scripts/replay-egl.py.
 * It neither implements a second simulation nor controls a browser.
 */
// @ts-nocheck
import fs from 'node:fs';
import {HaikuarelleEngine} from '../src/engine/WatercolorEngine';
import {PALETTES,PLUMAGE_PIGMENTS} from '../src/engine/palettes';
import {analyzePCM} from '../src/audio/analyze';
import {signal} from '../tests/audio.fixture';
import {BIRDS,BIRD_PADS,BIRD_BRUSHES} from '../src/birds/catalog';
const destination=process.argv[2];
if(!destination)throw new Error('Usage: render-offscreen <trace.jsonl>');
const output=fs.openSync(destination,'w');
const write=(data:unknown)=>fs.writeSync(output,JSON.stringify(data)+'\n');
let id=0,boundTexture:any,boundFbo:any,program:any,unit=0,nextCapture='capture',boundBuffer:any,boundVao:any,blending=false,saveDryingAtlas=false;
const textures=new Map(),programs=new Map(),samplers=new Map();
const constants:Record<string,number>={
  RG16F:33327,R16F:33325,RGBA16F:34842,RGBA8:32856,RG:33319,RED:6403,RGBA:6408,
  HALF_FLOAT:5131,UNSIGNED_BYTE:5121,FLOAT:5126,LINEAR:9729,NEAREST:9728,
  FRAMEBUFFER:36160,FRAMEBUFFER_COMPLETE:36053,COLOR_ATTACHMENT0:36064,
  TEXTURE0:33984,TEXTURE_2D:3553,TEXTURE_MIN_FILTER:10241,TEXTURE_MAG_FILTER:10240,TEXTURE_WRAP_S:10242,TEXTURE_WRAP_T:10243,CLAMP_TO_EDGE:33071,
  VERTEX_SHADER:35633,FRAGMENT_SHADER:35632,COMPILE_STATUS:35713,LINK_STATUS:35714,ACTIVE_UNIFORMS:35718,MAX_TEXTURE_SIZE:3379,NO_ERROR:0,
  BLEND:3042,ONE:1,SRC_ALPHA:770,ONE_MINUS_SRC_ALPHA:771,ARRAY_BUFFER:34962,STATIC_DRAW:35044,DYNAMIC_DRAW:35048,TRIANGLES:4,UNPACK_ALIGNMENT:3317,
};
const gl=new Proxy({
  ...constants,
  createVertexArray:()=>({id:++id}),createBuffer:()=>({id:++id}),
  bindVertexArray:(vao:any)=>{boundVao=vao;},
  bindBuffer:(_:number,buffer:any)=>{boundBuffer=buffer;},
  bufferData:(_:number,data:any)=>write({op:'buffer',id:boundBuffer.id,data:typeof data==='number'?[]:Array.from(data),size:typeof data==='number'?data:undefined}),
  bufferSubData:(_:number,offset:number,data:any)=>write({op:'bufferSubData',id:boundBuffer.id,offset,data:Array.from(data)}),
  vertexAttribPointer:(index:number,size:number,type:number,normalized:boolean,stride:number,offset:number)=>write({op:'attribute',vao:boundVao.id,buffer:boundBuffer.id,index,size,stride,offset}),
  enable:(key:number)=>{if(key===3042)blending=true;},disable:(key:number)=>{if(key===3042)blending=false;},
  createTexture:()=>({id:++id}),createFramebuffer:()=>({id:++id}),
  createShader:(type:number)=>({id:++id,type,source:''}),
  shaderSource:(s:any,source:string)=>{s.source=source;},getShaderParameter:()=>true,
  createProgram:()=>{const p={id:++id,shaders:[],uniforms:{},names:[]};programs.set(p.id,p);return p;},
  attachShader:(p:any,s:any)=>p.shaders.push(s),
  linkProgram:(p:any)=>{
    const all=p.shaders.map(s=>s.source).join('\n');
    p.names=Array.from(all.matchAll(/uniform\s+(?:lowp\s+|mediump\s+|highp\s+)?\w+\s+([^;]+);/g)).flatMap(m=>m[1].split(',').map(v=>v.trim().match(/^\w+/)![0]));
    write({op:'program',id:p.id,vertex:p.shaders.find(s=>s.type===35633).source,fragment:p.shaders.find(s=>s.type===35632).source});
  },
  getProgramParameter:(p:any,key:number)=>key===35718?p.names.length:true,
  getActiveUniform:(p:any,i:number)=>({name:p.names[i]}),getUniformLocation:(p:any,name:string)=>({p,name}),
  getParameter:(key:number)=>key===3379?4096:0,getExtension:()=>true,isContextLost:()=>false,
  checkFramebufferStatus:()=>36053,getError:()=>0,
  bindTexture:(_:number,t:any)=>{boundTexture=t;samplers.set(unit,t);},activeTexture:(v:number)=>{unit=v-33984;},
  texImage2D:(_:number,l:number,internal:number,w:number,h:number,b:number,format:number,type:number,data:any)=>{
    textures.set(boundTexture.id,{w,h});write({op:'texture',id:boundTexture.id,w,h,internal,format,type,data:data?Array.from(data):null});
  },
  texParameteri:(_:number,key:number,value:number)=>write({op:'parameter',id:boundTexture.id,key,value}),
  bindFramebuffer:(_:number,f:any)=>{boundFbo=f;},
  framebufferTexture2D:(_:number,attachment:number,_t:number,tex:any)=>write({op:'attachment',fbo:boundFbo.id,attachment:attachment-36064,tex:tex.id}),
  viewport:(x:number,y:number,w:number,h:number)=>{gl.currentViewport=[x,y,w,h];},
  useProgram:(p:any)=>{program=p;},
  uniform1i:(u:any,x:number)=>{if(u)u.p.uniforms[u.name]=[x];},uniform1f:(u:any,x:number)=>{if(u)u.p.uniforms[u.name]=[x];},
  uniform2f:(u:any,...x:number[])=>{if(u)u.p.uniforms[u.name]=x;},uniform3f:(u:any,...x:number[])=>{if(u)u.p.uniforms[u.name]=x;},uniform4f:(u:any,...x:number[])=>{if(u)u.p.uniforms[u.name]=x;},
  uniform3fv:(u:any,x:any)=>{if(u)u.p.uniforms[u.name]=Array.from(x);},uniform4fv:(u:any,x:any)=>{if(u)u.p.uniforms[u.name]=Array.from(x);},
  drawArrays:(_:number,first:number,count:number)=>{
    write({op:'draw',vao:boundVao.id,count,blend:blending,program:program.id,fbo:boundFbo?.id??null,viewport:gl.currentViewport,uniforms:program.uniforms,textures:Object.fromEntries([...samplers].map(([k,t])=>[k,t?.id??null]))});
    if(saveDryingAtlas&&program.shaders.some(s=>s.source.includes('float pockets ='))){
      saveDryingAtlas=false;write({op:'capture',fbo:boundFbo.id,w:gl.currentViewport[2],h:gl.currentViewport[3],name:'drying-alpha-atlas'});
    }
  },
  readPixels:(x:number,y:number,w:number,h:number)=>write({op:'capture',fbo:boundFbo.id,w,h,name:nextCapture}),
  deleteBuffer:(b:any)=>{if(b)write({op:'deleteBuffer',id:b.id});},
  deleteVertexArray:(v:any)=>{if(v)write({op:'deleteVao',id:v.id});},
  deleteTexture:(t:any)=>{if(t)write({op:'deleteTexture',id:t.id});},deleteFramebuffer:(t:any)=>{if(t)write({op:'deleteFramebuffer',id:t.id});},
  deleteProgram:(p:any)=>{if(p)write({op:'deleteProgram',id:p.id});},
},{get:(target,key)=>key in target?target[key]:(()=>{})});
Object.assign(globalThis,{
  document:{hidden:true,addEventListener(){},removeEventListener(){}},
  devicePixelRatio:1,matchMedia:()=>({matches:false}),
  ResizeObserver:class{observe(){}disconnect(){}},
  requestAnimationFrame:()=>0,cancelAnimationFrame:()=>{},
});
const canvas={width:512,height:384,getContext:()=>gl,getBoundingClientRect:()=>({width:512,height:384}),addEventListener(){},removeEventListener(){}};
const e=new HaikuarelleEngine(canvas as any);
const mode=process.argv[3];
if(mode==='definition'){
  e.update({format:'portrait',palette:'plumages',ink:.48,resonance:.96,wetness:.53,granulation:.84});
  const capture=(name,sharpness=.72,threshold=.56,high=false)=>{
    const look={...e.paint.look};e.paint.setLook({...look,dryingSharpness:sharpness,dryingThreshold:threshold});nextCapture=name;
    if(high)e.paint.capture(4096/Math.max(e.paint.viewW,e.paint.viewH),0);else e.capturePreview();
    e.paint.setLook(look);
  };
  for(const id of ['geai','bouvreuil','corneille']){
    const bird=BIRD_BRUSHES.find(b=>b.id===id),index=BIRD_BRUSHES.indexOf(bird),seed=106101+index;
    const raw=fs.readFileSync(`${process.argv[4]}/${id}.f32`);
    const analysis=analyzePCM({left:new Float32Array(raw.buffer,raw.byteOffset,raw.length/4),sampleRate:16000});
    e.beginSignature(seed);capture(`${id}-blank-soft`,0,0);capture(`${id}-blank`);
    let elapsed=0,stopped=false,wetShown=false;e.startBirdBrush(analysis,bird,seed,.84,0,()=>elapsed);
    e.composition.duration=5.8+(3.4+5.2*.53)*5.6;
    await e.finish(time=>{
      elapsed=time%(analysis.duration+.28);
      if(time<5.8){
        const q=time/5.8,u=q<.7?.62*Math.pow(q/.7,1.25):.62+.38*Math.pow((q-.7)/.3,.6);
        e.moveBrush({x:.47+.16*Math.sin(u*Math.PI*2-.65)+.035*Math.sin(u*11+index),y:.24+.48*u},time*1000,.72+.12*Math.sin(u*7));
      }else if(!stopped){stopped=true;e.stopBird();}
      if(!wetShown&&time>=2){wetShown=true;capture(`${id}-wet-soft`,0,0);capture(`${id}-wet`);}
    });
    capture(`${id}-soft`,0,0);capture(`${id}-dry`);capture(`${id}-dry-stable`);
    capture(`${id}-threshold-low`,.72,.15);capture(`${id}-threshold-high`,.72,.95);
    if(id==='geai'){
      capture('definition-soft-4096',0,0,true);capture('definition-4096',.72,.56,true);
      e.beginSignature(seed);capture('definition-cleared');
    }
  }
}else if(mode==='direct'||mode==='direct-jets'){
  const analyses=new Map(BIRD_BRUSHES.map(bird=>{
    const raw=fs.readFileSync(`${process.argv[4]}/${bird.id}.f32`);
    return [bird.id,analyzePCM({left:new Float32Array(raw.buffer,raw.byteOffset,raw.length/4),sampleRate:16000})];
  }));
  e.update({format:'portrait',palette:'plumages',ink:.48,resonance:.96,wetness:.53,granulation:.84});
  const capture=(name,high=false)=>{nextCapture=name;if(high)e.paint.capture(4096/Math.max(e.paint.viewW,e.paint.viewH),0);else e.capturePreview();};
  let released=false,maxSegments=0,afterRelease=0;
  const originalStep=e.paint.step.bind(e.paint),metrics=[];
  e.paint.step=(dt,now,segs,drops)=>{maxSegments=Math.max(maxSegments,segs.length);if(released)afterRelease+=segs.length;return originalStep(dt,now,segs,drops);};
  const run=async(bird,index,replay=false)=>{
    const seed=106101+index;e.beginSignature(seed);released=false;maxSegments=0;afterRelease=0;
    const analysis=analyses.get(bird.id);let elapsed=0,stopped=false,counts=null;
    e.startBirdBrush(analysis,bird,seed,.84,0,()=>elapsed);
    e.composition.duration=5.8+(3.4+5.2*.53)*5.6;
    await e.finish(time=>{
      elapsed=time%(analysis.duration+.28);
      if(time<5.8){
        const q=time/5.8,u=q<.7?.62*Math.pow(q/.7,1.25):.62+.38*Math.pow((q-.7)/.3,.6);
        const p={x:.47+.16*Math.sin(u*Math.PI*2-.65)+.035*Math.sin(u*11+index),y:.24+.48*u};
        e.moveBrush(p,time*1000,.72+.12*Math.sin(u*7));
      }else if(!stopped){counts=e.brushFeedback;stopped=true;e.stopBird();released=true;}
    });
    capture(replay?'direct-replay':`direct-${bird.id}`);
    metrics.push({bird:bird.id,seed,replay,maxSegments,segmentsAfterRelease:afterRelease,feedback:counts});
    if(bird.id==='geai'&&!replay){capture('direct-4096',true);capture('direct-stable');}
  };
  for(let i=0;i<BIRD_BRUSHES.length;i++)if(mode==='direct'||['corneille','geai','mesange','picvert'].includes(BIRD_BRUSHES[i].id))await run(BIRD_BRUSHES[i],i);
  await run(BIRD_BRUSHES[2],2,true);
  fs.writeFileSync(destination.replace('.jsonl','-metrics.json'),JSON.stringify(metrics,null,2));
}else if(mode==='plumage-basis'){
  e.update({format:'portrait',palette:'plumages'});e.beginSignature(95021);
  const paint=e.paint,k=paint.k,look={...paint.look};paint.setLook({...look,pigments:PLUMAGE_PIGMENTS.slice(0,3)});
  for(let i=0;i<3;i++){
    const x=(.23+i*.27)*paint.fieldW,y=.7*paint.fieldH;
    for(let tick=0;tick<3;tick++)paint.step(1/30,tick*1000/30,[{ax:x,ay:y,bx:x+1,by:y,radius:55*k,target:.55,strength:.8,kind:0,slot:i,fx:0,fy:0,coupling:0}],[]);
  }
  nextCapture='plumage-basis-three';e.capturePreview();
  paint.setLook({...look,pigments:PLUMAGE_PIGMENTS});
  nextCapture='plumage-basis-eleven';e.capturePreview();
}else if(mode==='plumages'||mode==='plumage-pic'){
  const birds=BIRD_BRUSHES.filter(b=>b.signature);
  const analyses=new Map([...birds,...BIRD_PADS].map(bird=>{
    const raw=fs.readFileSync(`${process.argv[4]}/${bird.id}.f32`);
    return [bird.id,analyzePCM({left:new Float32Array(raw.buffer,raw.byteOffset,raw.length/4),sampleRate:16000})];
  }));
  e.update({format:'portrait',palette:'plumages',ink:.48,resonance:.96,wetness:.6,granulation:.85});
  const capture=(name,high=false)=>{nextCapture=name;if(high)e.paint.capture(4096/Math.max(e.paint.viewW,e.paint.viewH),0);else e.capturePreview();};
  const wet=async(cx=.48,cy=.46,size=.72)=>{
    const start=e.status.ticks/30;
    for(let i=0;i<=42;i++){
      const u=i/42-.5;e.wetBrush({x:cx+u*.46,y:cy+u*.29+.065*Math.sin(u*6)},size,.5);
    }
    e.liftWaterBrush();
    for(let i=0;i<=20;i++){
      const u=i/20;e.wetBrush({x:cx-.06+.22*u,y:cy+.02-.17*u},.36,.5);
    }
    e.liftWaterBrush();e.composition.duration=start+.7;await e.finish();
  };
  const cast=async(bird,seed,point={x:.45,y:.45},layer=0)=>{
    const start=e.status.ticks/30;let elapsed=0;
    e.startSoundStain(analyses.get(bird.id),bird,point,seed,.66,layer,()=>elapsed);
    await e.finish(time=>{elapsed=time-start;});
  };
  if(mode==='plumage-pic'){
    e.beginSignature(95004);await wet();await cast(birds[3],95004);capture('plumage-picvert');capture('plumage-picvert-4096',true);
    e.destroy();fs.closeSync(output);console.log('Pic vert trace written.');process.exit(0);
  }
  for(let i=0;i<birds.length;i++){
    const bird=birds[i],seed=95001+i;e.beginSignature(seed);await wet();await cast(bird,seed);
    capture(`plumage-${bird.id}`);
    if(!i){capture('plumage-4096',true);capture('plumage-mesange-stable');}
  }
  e.beginSignature(95001);await wet();await cast(birds[0],95001);capture('plumage-mesange-replay');
  // One mixed sheet, followed by pad/parameter changes WITHOUT physics ticks.
  e.beginSignature(95011);await wet(.38,.40,.72);await cast(birds[0],95011,{x:.35,y:.39});
  await wet(.60,.55,.68);await cast(birds[1],95012,{x:.57,y:.54},1);
  capture('plumage-rencontre');
  e.paint.setLook({...e.paint.look});capture('plumage-rencontre-stable');
  // Seven isolated swatches on ONE field: later pigments must never recolour earlier ones.
  e.beginSignature(95021);const paint=e.paint,k=paint.k;
  for(let i=0;i<11;i++){
    const x=(.23+(i%3)*.27)*paint.fieldW,y=(.83-Math.floor(i/3)*.19)*paint.fieldH;
    for(let tick=0;tick<3;tick++)paint.step(1/30,tick*1000/30,[{ax:x,ay:y,bx:x+1,by:y,radius:45*k,target:.55,strength:.8,kind:0,slot:i,fx:0,fy:0,coupling:0}],[]);
    if(i===2)capture('plumage-first-three');
  }
  capture('plumage-eleven-pigments');
}else if(mode==='drying'){
  const analyses=new Map(BIRD_PADS.map(bird=>{
    const raw=fs.readFileSync(`${process.argv[4]}/${bird.id}.f32`);
    return [bird.id,analyzePCM({left:new Float32Array(raw.buffer,raw.byteOffset,raw.length/4),sampleRate:16000})];
  }));
  e.update({format:'portrait',palette:'plumages',ink:.55,resonance:.96,wetness:.60,granulation:.84});
  const capture=(name,detail=1,high=false)=>{
    const look={...e.paint.look};e.paint.setLook({...look,dryingDetail:detail});nextCapture=name;
    if(high)e.paint.capture(4096/Math.max(e.paint.viewW,e.paint.viewH),0);else e.capturePreview();
    e.paint.setLook(look);
  };
  for(let index=0;index<3;index++){
    const seed=84017+index,bird=BIRD_PADS[index];e.beginSignature(seed);
    if(!index){capture('drying-blank',0);capture('drying-blank-masks',1);}
    for(let i=0;i<=42;i++){
      const u=i/42-.5;e.wetBrush({x:.47+u*.45,y:.46+u*.24+.06*Math.sin(u*6)},.73,.5);
    }
    e.liftWaterBrush();
    for(let i=0;i<=22;i++){
      const u=i/22;e.wetBrush({x:.38+.19*u,y:.48-.12*u+.035*Math.sin(u*4)},.42,.5);
    }
    e.liftWaterBrush();e.composition.duration=.7;await e.finish();
    const analysis=analyses.get(bird.id),start=e.status.ticks/30;let elapsed=0,shown=false;
    e.startSoundStain(analysis,bird,{x:.45,y:.45},seed,.68,0,()=>elapsed);
    await e.finish(time=>{
      elapsed=time-start;
      if(!shown&&elapsed>=Math.min(.5,analysis.duration*.55)){
        shown=true;capture(`drying-${bird.id}-wet-before`,0);capture(`drying-${bird.id}-wet`,1);
      }
    });
    capture(`drying-${bird.id}-before`,0);capture(`drying-${bird.id}`,1);
    if(index===1){saveDryingAtlas=true;capture('drying-4096',1,true);capture('drying-stable',1);}
  }
}else if(mode==='circulation'){
  const raw=fs.readFileSync(`${process.argv[4]}/geai.f32`);
  const analysis=analyzePCM({left:new Float32Array(raw.buffer,raw.byteOffset,raw.length/4),sampleRate:16000});
  e.update({format:'portrait',palette:'plumages',ink:.5,resonance:.96,wetness:.65,granulation:.8});
  e.beginSignature(73021);nextCapture='circulation-papier';e.capturePreview();
  // A long basin with two arms, plus an intentionally disconnected pool.
  const lines=[[{x:.15,y:.4},{x:.84,y:.4},.64],[{x:.62,y:.4},{x:.62,y:.65},.56],[{x:.24,y:.77},{x:.40,y:.77},.56]];
  for(const [a,b,size] of lines){
    for(let i=0;i<=22;i++){const u=i/22;e.wetBrush({x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u},size,.5);}
    e.liftWaterBrush();
  }
  e.composition.duration=.8;await e.finish();nextCapture='circulation-eau';e.capturePreview();
  const start=e.status.ticks/30;let elapsed=0,formed=false,migrated=false;
  e.startSoundStain(analysis,BIRD_PADS[2],{x:.38,y:.4},73021,.66,0,()=>elapsed);
  await e.finish(time=>{
    elapsed=time-start;
    if(!formed&&elapsed>=1){formed=true;nextCapture='circulation-chant';e.capturePreview();}
    if(!migrated&&elapsed>=6){migrated=true;nextCapture='circulation-migration';e.capturePreview();}
  });
  nextCapture='circulation-seche';e.capturePreview();
  nextCapture='circulation-4096';e.paint.capture(4096/Math.max(e.paint.viewW,e.paint.viewH),0);
}else if(mode==='water'||mode==='water-replay'){
  const analyses=new Map(BIRD_PADS.map(bird=>{
    const raw=fs.readFileSync(`${process.argv[4]}/${bird.id}.f32`);
    return [bird.id,analyzePCM({left:new Float32Array(raw.buffer,raw.byteOffset,raw.length/4),sampleRate:16000})];
  }));
  e.update({format:'portrait',palette:'plumages',ink:.55,resonance:.96,wetness:.53,granulation:.82});
  const wet=async(cx,cy,tilt=0,size=.68)=>{
    const start=e.status.ticks/30;
    for(let i=0;i<42;i++){
      const u=i/41-.5;
      e.wetBrush({x:cx+u*.52,y:cy+u*tilt+.045*Math.sin(u*6)},size,.5);
    }
    e.liftWaterBrush();e.composition.duration=start+.7;await e.finish();
  };
  const drop=async(bird,point,seed,size=.65,early=false)=>{
    const analysis=analyses.get(bird.id),start=e.status.ticks/30;let elapsed=0,shown=false;
    const ok=e.startSoundStain(analysis,bird,point,seed,size,0,()=>elapsed);
    if(!ok)throw new Error('QA sample rejected on prepared paper.');
    await e.finish(time=>{
      elapsed=time-start;
      if(early&&!shown&&elapsed>=.65){shown=true;nextCapture='eau-chant-en-formation';e.capturePreview();}
    });e.stopBird();
  };
  for(let i=0;i<(mode==='water'?3:0);i++){
    const seed=62001+i;e.beginSignature(seed);write({op:'begin',seed,palette:BIRD_PADS[i].id});
    await wet(.49,.46,.4,.76);
    if(i===0){nextCapture='papier-humide';e.capturePreview();}
    await drop(BIRD_PADS[i],{x:.49,y:.46},seed,.76,i===1);
    nextCapture=`eau-chant-${BIRD_PADS[i].id}`;e.capturePreview();
  }
  for(const [index,seed] of (mode==='water-replay'?[62004]:[62004,62005]).entries()){
    e.beginSignature(seed);write({op:'begin',seed,palette:'composition'});
    await wet(.48,.39,.46,.78);await drop(BIRD_PADS[1],{x:.48,y:.39},seed,.78);
    await wet(.51,.55,-.28,.72);await drop(BIRD_PADS[2],{x:.51,y:.55},seed+1,.72);
    await wet(.43,.49,.62,.45);await drop(BIRD_PADS[0],{x:.43,y:.49},seed+2,.42);
    nextCapture=mode==='water-replay'?'eau-chant-replay':`eau-chant-${seed}`;e.capturePreview();
    if(index===0){nextCapture='eau-chant-4096';e.paint.capture(4096/Math.max(e.paint.viewW,e.paint.viewH),0);}
  }
}else if(mode==='motion'){
  const analyses=new Map(BIRD_PADS.map(bird=>{
    const raw=fs.readFileSync(`${process.argv[4]}/${bird.id}.f32`);
    return [bird.id,analyzePCM({left:new Float32Array(raw.buffer,raw.byteOffset,raw.length/4),sampleRate:16000})];
  }));
  e.update({format:'portrait',palette:'plumages',ink:.62});
  const paint=async(bird,seed,duration,shape,size=.55)=>{
    const analysis=analyses.get(bird.id);let elapsed=0;const start=e.status.ticks/30;
    e.startBirdBrush(analysis,bird,seed,size,0,()=>elapsed%(analysis.duration+(bird.id==='geai'?1.25:1.05)));
    await e.finish(time=>{
      elapsed=time-start;
      if(elapsed>=.12&&elapsed<duration+.12){
        // 120 Hz pointer samples, passed through the same live queue as browser events.
        for(let j=0;j<4;j++){const t=elapsed+j/120;const p=shape(Math.min(1,(t-.12)/duration));e.moveBrush(p,t*1000,.5);}
      }else e.liftBrush();
    });
    e.stopBird();await e.finish();
  };
  const arc=u=>({x:.23+.50*u,y:.34+.24*u+.11*Math.sin(u*Math.PI*2)});
  for(const [name,bird,duration] of [
    ['corneille-lente',BIRD_PADS[0],2.55],['corneille-vive',BIRD_PADS[0],.48],
    ['rougegorge',BIRD_PADS[1],2.55],['geai',BIRD_PADS[2],.56],
  ]){
    e.beginSignature(1707);write({op:'begin',seed:1707,palette:name});
    await paint(bird,1707,duration,arc,.63);nextCapture=`plumage-${name}`;e.capturePreview();
  }
  e.beginSignature(58029);
  for(let i=0;i<3;i++){
    const shape=u=>({x:.28+.32*u+.045*Math.sin(u*Math.PI*2+i),y:.26+i*.17+.095*Math.sin(u*Math.PI*1.8)});
    await paint(BIRD_PADS[i],58029+i,i===2?.57:2.55,shape,.55);
  }
  nextCapture='signature-mouvement';e.capturePreview();
  nextCapture='signature-mouvement-4096';e.paint.capture(4096/Math.max(e.paint.viewW,e.paint.viewH),0);
}else if(mode==='birds'){
  const analyses=new Map(BIRDS.map(bird=>{
    const raw=fs.readFileSync(`${process.argv[4]}/${bird.id}.f32`);
    const left=new Float32Array(raw.buffer,raw.byteOffset,raw.length/4);
    return [bird.id,analyzePCM({left,sampleRate:16000})];
  }));
  e.update({format:'portrait',palette:'estuaire',ink:.7});e.beginSignature(58017);
  nextCapture='bird-paper';e.capturePreview();
  const placements=[['merle',.38,.31],['rougegorge',.46,.40],['rossignol',.47,.50],['fauvette',.45,.60],['hibou',.50,.67]];
  for(let i=0;i<placements.length;i++){
    const [id,x,y]=placements[i],bird=BIRDS.find(b=>b.id===id);
    write({op:'begin',seed:58017+i,palette:id});
    e.playBird(analyses.get(id),bird,{x,y},58017+i,.7,i);
    await e.finish();e.stopBird();
    if(i===0){nextCapture='bird-first';e.capturePreview();}
  }
  nextCapture='bird-signature';e.capturePreview();
  nextCapture='bird-signature-4096';e.paint.capture(4096/Math.max(e.paint.viewW,e.paint.viewH),0);
}else if(mode==='hd'){
  const analysis=analyzePCM(signal('music'));
  for(const [index,format] of (['landscape','portrait','landscape'] as const).entries()){
    e.update({format,palette:'estuaire',granulation:.72,wetness:.64,complexity:.52,ink:.72});
    e.setAudio(analysis);
    if(index<2){nextCapture=`paper-${format}`;e.capturePreview();}
    write({op:'begin',seed:analysis.seed,palette:format});
    await e.finish();
    nextCapture=index===2?'hd-replay':`hd-${format}`;e.capturePreview();
    if(index<2){nextCapture=`hd-${format}-4096`;e.paint.capture(4096/Math.max(e.paint.viewW,e.paint.viewH),0);}
  }
}else if(mode==='audio'){
  let document=signal('music');
  if(process.argv[4]){
    const raw=fs.readFileSync(process.argv[4]);
    const interleaved=new Float32Array(raw.buffer,raw.byteOffset,raw.length/4);
    document={sampleRate:16000,left:Float32Array.from({length:interleaved.length/2},(_,i)=>interleaved[i*2]),right:Float32Array.from({length:interleaved.length/2},(_,i)=>interleaved[i*2+1])};
  }
  const analyses=[analyzePCM(document),analyzePCM(signal('bass')),analyzePCM(signal('pulses'))];
  for(let i=0;i<4;i++){
    const index=i===3?0:i,analysis=analyses[index];
    e.update({palette:PALETTES[index===2?2:0].id,granulation:.72,wetness:.64,complexity:.52,ink:.72});
    write({op:'begin',seed:analysis.seed,palette:PALETTES[index].id});
    e.setAudio(analysis);await e.finish();
    nextCapture=i===3?'audio-replay':`audio-${index}`;e.capturePreview();
    if(i===0){nextCapture='audio-4096';e.paint.capture(4,0);}
  }
  // Capture the same paint without its overlay, so the actual ink contribution is verified.
  e.paint.afterRender=undefined;nextCapture='audio-without-ink';e.capturePreview();
}else{
  const only=mode?Number(mode):null;
  for(let i=0;i<(only===null?6:1);i++){
    const index=only===null?Math.min(i,4):(only%5);
    const seed=only??240105+Math.min(i,4);
    e.update({palette:PALETTES[index].id,granulation:.72,wetness:.64,complexity:.52});
    write({op:'begin',seed,palette:PALETTES[index].id});
    e.generate(seed);await e.finish();
    nextCapture=i===5?'replay-240109':`etude-${seed}`;e.capturePreview();
    if(i===4){
      nextCapture='haikuarelle-240109-4096';e.paint.capture(4,0);
      e.setGranulation(0);nextCapture='texture-0';e.capturePreview();
      e.setGranulation(1);nextCapture='texture-100';e.capturePreview();e.setGranulation(.72);
    }
  }
}
e.destroy();fs.closeSync(output);
console.log(`Trace written to ${destination}`);
