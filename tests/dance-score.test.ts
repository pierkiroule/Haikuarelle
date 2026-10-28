import {describe,it,expect} from 'vitest';
import {soundAt,danceEnvelope,videoMime,videoSize,visualTime} from '../src/dance/score';
import type {AudioAnalysis} from '../src/audio/types';
import {flightPose,flightMatrix,flightMesh,pigmentFocus,surfacePosition,processState} from '../src/dance/flight';
describe('single watercolor process dance',()=>{
 it('emerges, diffuses, then dries and settles',()=>{
  expect(processState(0).emergence).toBe(0);expect(processState(10).emergence).toBe(1);expect(processState(14).diffusion).toBe(1);
  expect(processState(18).drying).toBe(0);expect(processState(28).drying).toBe(1);expect(processState(28).fluidity).toBe(0);
  let previous=processState(0);for(let t=0;t<=30;t+=.1){const s=processState(t);expect(s.emergence).toBeGreaterThanOrEqual(previous.emergence);expect(s.drying).toBeGreaterThanOrEqual(previous.drying);previous=s;}
 });
 it('accompanies the single artwork with finite, continuous camera matrices',()=>{
  let prior=flightPose(0).eye;
  for(let i=0;i<=900;i++){const pose=flightPose(i/30);expect(Math.hypot(...pose.eye.map((v,j)=>v-prior[j]))).toBeLessThan(.09);prior=pose.eye;expect(pose.eye[2]-pose.target[2]).toBeGreaterThan(1);}
  for(const aspect of [9/16,16/9,1])for(let t=0;t<=30;t+=.1)expect([...flightMatrix(t,aspect)].every(Number.isFinite)).toBe(true);
 });
 it('keeps original left/right positions and settles to one flat complete painting',()=>{
  for(const ratio of [.4,.7,1.7])for(const u of [0,.25,.5,1])for(const v of [0,.5,1]){
   const p=surfacePosition(u,v,28,ratio);expect(p[0]).toBeCloseTo((u-.5)*2/Math.max(1,ratio)*ratio);expect(p[1]).toBeCloseTo((.5-v)*2/Math.max(1,ratio));expect(p[2]).toBeCloseTo(0);
  }
  const left=surfacePosition(.2,.4,12),right=surfacePosition(.8,.4,12);expect(left[2]).not.toBeCloseTo(right[2]);
 });
 it('creates deep asymmetric folds and close passes, then restores a complete final view',()=>{
  const depths=[];for(let u=0;u<=1;u+=.1)for(let v=0;v<=1;v+=.1)depths.push(surfacePosition(u,v,12)[2]);
  expect(Math.max(...depths)-Math.min(...depths)).toBeGreaterThan(.8);
  const distance=(t:number)=>{const p=flightPose(t);return Math.hypot(...p.eye.map((v,i)=>v-p.target[i]));};
  expect(distance(6)).toBeLessThan(distance(28)*.6);expect(Math.hypot(...flightPose(28).target)).toBe(0);
 });
 it('uses bounded indexed meshes for the one fluid surface',()=>{
  const compact=flightMesh(true),hd=flightMesh(false);expect(hd.vertices.length).toBeGreaterThan(compact.vertices.length);expect(hd.vertices.length/2).toBeLessThan(65536);
  for(const mesh of [compact,hd])expect(mesh.indices.every(i=>i<mesh.vertices.length/2)).toBe(true);
 });
 it('keeps thirty seconds of forward choreography',()=>{
  expect(visualTime(0)).toBe(0);expect(visualTime(15)).toBe(15);expect(visualTime(30)).toBe(30);expect(processState(visualTime(29)).drying).toBe(1);
 });
 it('keeps breaths between forward bird phrases throughout thirty seconds',()=>{
  const analysis={duration:1,frames:Array.from({length:30},()=>({energy:.8,bass:.4,treble:.3,flux:.2}))} as AudioAnalysis;
  expect(soundAt(analysis,.5).energy).toBe(.8);expect(soundAt(analysis,1.2).energy).toBe(0);expect(soundAt(analysis,1.5).energy).toBe(.8);expect(soundAt(analysis,30).energy).toBe(0);
 });
 it('softens isolated sonic attacks and remains deterministic for video export',()=>{
  const analysis={duration:5,frames:Array.from({length:150},(_,i)=>({energy:i===60?1:0,bass:0,treble:i===60?1:0,flux:i===60?1:0}))} as AudioAnalysis;
  expect(soundAt(analysis,2).energy).toBe(1);
  const attack=danceEnvelope(analysis,2);expect(attack.energy).toBeGreaterThan(0);expect(attack.energy).toBeLessThan(.12);
  expect(danceEnvelope(analysis,2.3).energy).toBeGreaterThan(0);expect(danceEnvelope(analysis,2.7).energy).toBe(0);
  danceEnvelope(analysis,20);expect(danceEnvelope(analysis,2)).toEqual(attack);
  expect(danceEnvelope(analysis,30).energy).toBe(0);
 });
 it('chooses H264 MP4 or an honest WebM fallback and adapts resolution',()=>{
  expect(videoMime(m=>m==='video/mp4;codecs=avc1.42E01E,mp4a.40.2')).toContain('avc1');expect(videoMime(m=>m==='video/mp4')).toBeNull();expect(videoMime(m=>m==='video/webm')).toBe('video/webm');expect(videoMime(()=>false)).toBeNull();expect(videoSize(true,8)).toEqual({width:720,height:1280});
 });
});
it('frames painted matter and finds real pigment',async()=>{
 const {paintingBounds}=await import('../src/dance/framing');const pixels=new Uint8ClampedArray(100*100*4).fill(255);for(let y=40;y<60;y++)for(let x=30;x<50;x++)pixels.set([90,70,40,255],(y*100+x)*4);
 expect(paintingBounds(pixels,100,100,[1,1,1]).width).toBeLessThan(.5);expect(pigmentFocus(pixels,100,100,[1,1,1],1)[0][0]).toBeGreaterThan(.25);
});
it('promotes the public atelier rather than a local preview',async()=>{const {publicSiteAddress}=await import('../src/brand');expect(publicSiteAddress('http://127.0.0.1:5173/')).not.toContain('127.0.0.1');});
