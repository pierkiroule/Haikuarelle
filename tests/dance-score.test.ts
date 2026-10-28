import {describe,it,expect} from 'vitest';
import {soundAt,videoMime,videoSize,visualTime} from '../src/dance/score';
import type {AudioAnalysis} from '../src/audio/types';
import {flightPose,flightMatrix,flightMesh,pigmentFocus,wingPosition,birdMotion,birdFeet,WIRE_Z,wireHeight,LANDING_TIME} from '../src/dance/flight';
describe('bird flight and landing',()=>{
 it('beats its wings, glides, approaches and folds after touching the wire',()=>{
  const beats=Array.from({length:210},(_,i)=>birdMotion(i/30).flap),glide=Array.from({length:120},(_,i)=>birdMotion(12+i/30).flap);
  expect(Math.max(...beats)-Math.min(...beats)).toBeGreaterThan(1.4);expect(Math.max(...glide)-Math.min(...glide)).toBeLessThan(.09);
  expect(birdMotion(20).feet).toBe(0);expect(birdMotion(24).feet).toBe(1);expect(birdMotion(LANDING_TIME-.01).contact).toBe(false);expect(birdMotion(LANDING_TIME).contact).toBe(true);
  expect(birdMotion(24).fold).toBe(0);expect(birdMotion(29).fold).toBe(1);expect(birdMotion(29).position[2]).toBe(WIRE_Z);
 });
 it('lands without a position jump and keeps both grips on the moving cable',()=>{
  const a=birdMotion(24.999).position,b=birdMotion(25.001).position;expect(Math.hypot(...a.map((v,i)=>v-b[i]))).toBeLessThan(.001);
  for(const time of [25,26,28,30]){const feet=birdFeet(time);for(const index of [3,13]){expect(feet[index][2]).toBe(WIRE_Z);expect(feet[index][1]).toBeCloseTo(wireHeight(feet[index][0],time),8);}}
  expect(birdFeet(10)).toEqual([]);
 });
 it('circles the travelling bird with finite, continuous camera matrices',()=>{
  let prior=flightPose(0).eye;const directions=new Set<number>();
  for(let i=0;i<=900;i++){const pose=flightPose(i/30);expect(Math.hypot(...pose.eye.map((v,j)=>v-prior[j]))).toBeLessThan(.07);prior=pose.eye;const angle=Math.atan2(pose.eye[0]-pose.target[0],pose.eye[2]-pose.target[2]);directions.add(Math.floor((angle+Math.PI)/(Math.PI/2)));}
  expect(directions.size).toBeGreaterThanOrEqual(4);
  for(const aspect of [9/16,16/9,1])for(let t=0;t<=30;t+=.1)expect([...flightMatrix(t,aspect)].every(Number.isFinite)).toBe(true);
 });
 it('preserves two full mirrored wing surfaces and folds them against the body',()=>{
  for(const ratio of [.4,.7,1.7])for(const time of [0,12,29])for(const u of [0,.25,.5,1]){const a=wingPosition([u,.4,0],time,1,ratio),b=wingPosition([u,.4,0],time,-1,ratio);expect(a[0]).toBe(-b[0]);expect(a.slice(1)).toEqual(b.slice(1));}
  expect(wingPosition([1,.5,0],29,1)[0]).toBeLessThan(wingPosition([1,.5,0],12,1)[0]*.4);
 });
 it('uses bounded indexed meshes for wings and small body parts',()=>{
  const compact=flightMesh(true),hd=flightMesh(false);expect(hd.vertices.length).toBeGreaterThan(compact.vertices.length);expect(hd.vertices.length/2).toBeLessThan(65536);
  for(const mesh of [compact,hd])expect(mesh.indices.every(i=>i<mesh.vertices.length/2)).toBe(true);
 });
 it('keeps the story forward so the final bird stays perched',()=>{
  expect(visualTime(0)).toBe(0);expect(visualTime(15)).toBe(15);expect(visualTime(30)).toBe(30);expect(birdMotion(visualTime(29)).contact).toBe(true);
 });
 it('keeps breaths between forward bird phrases throughout thirty seconds',()=>{
  const analysis={duration:1,frames:Array.from({length:30},()=>({energy:.8,bass:.4,treble:.3,flux:.2}))} as AudioAnalysis;
  expect(soundAt(analysis,.5).energy).toBe(.8);expect(soundAt(analysis,1.2).energy).toBe(0);expect(soundAt(analysis,1.5).energy).toBe(.8);expect(soundAt(analysis,30).energy).toBe(0);
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
