import {describe,it,expect} from 'vitest';
import {soundAt,videoMime,videoSize} from '../src/dance/score';
import type {AudioAnalysis} from '../src/audio/types';
import {flightPose,flightMatrix,flightMesh,pigmentFocus} from '../src/dance/flight';
describe('automatic FPV flight',()=>{
 it('approaches, banks and pulls back along a continuous route',()=>{
  const samples=Array.from({length:271},(_,i)=>flightPose(i/30));
  expect(Math.min(...samples.map(p=>p.eye[2]))).toBeLessThan(.9);expect(Math.max(...samples.map(p=>p.eye[2]))).toBeGreaterThan(2.4);
  expect(Math.min(...samples.map(p=>p.roll))).toBeLessThan(-.18);expect(Math.max(...samples.map(p=>p.roll))).toBeGreaterThan(.2);
  for(let i=1;i<samples.length;i++)expect(Math.hypot(...samples[i].eye.map((v,j)=>v-samples[i-1].eye[j]))).toBeLessThan(.08);
  expect(flightPose(0)).toEqual(flightPose(9));expect([...flightMatrix(0,9/16)]).toEqual([...flightMatrix(9,9/16)]);
 });
 it('keeps projection finite across formats and focuses close passes on pigment',()=>{
  for(const aspect of [9/16,16/9,1])for(let t=0;t<=9;t+=.1)expect([...flightMatrix(t,aspect,[[.2,.1,0],[-.2,-.1,0]])].every(Number.isFinite)).toBe(true);
  const base=flightPose(3.6),focused=flightPose(3.6,9/16,[[.2,.1,0]]);expect(focused.target[0]-base.target[0]).toBeCloseTo(.2);expect(focused.eye[0]-base.eye[0]).toBeCloseTo(.2);
 });
 it('uses a fine shared-vertex mesh within sixteen-bit mobile index limits',()=>{
  const compact=flightMesh(true),hd=flightMesh(false);expect(hd.vertices.length).toBeGreaterThan(compact.vertices.length);expect(hd.vertices.length/2).toBeLessThan(65536);
  for(const mesh of [compact,hd]){expect(mesh.indices.length%3).toBe(0);expect(mesh.indices.every(i=>i<mesh.vertices.length/2)).toBe(true);}
 });
 it('finds pigment instead of aiming at a blank centre',()=>{
  const pixels=new Uint8ClampedArray(64*64*4).fill(255);for(let y=5;y<18;y++)for(let x=45;x<58;x++)pixels.set([20,90,150,255],(y*64+x)*4);
  const focus=pigmentFocus(pixels,64,64,[1,1,1],1);expect(focus[0][0]).toBeGreaterThan(.15);expect(focus[0][1]).toBeGreaterThan(.15);
  expect(pigmentFocus(new Uint8ClampedArray(16).fill(255),2,2,[1,1,1],1)).toEqual([[0,0,0],[0,0,0]]);
 });
 it('keeps silent gaps and the six-second promotion silent',()=>{
  const analysis={duration:1,frames:Array.from({length:30},()=>({energy:.8,bass:.4,treble:.3,flux:.2}))} as AudioAnalysis;
  expect(soundAt(analysis,.5).energy).toBe(.8);expect(soundAt(analysis,1.2).energy).toBe(0);expect(soundAt(analysis,1.5).energy).toBe(.8);expect(soundAt(analysis,9).energy).toBe(0);
 });
 it('chooses true H264 MP4 or an honest WebM fallback, with mobile resolution',()=>{
  expect(videoMime(m=>m==='video/mp4;codecs=avc1.42E01E,mp4a.40.2')).toContain('avc1');expect(videoMime(m=>m==='video/mp4')).toBeNull();expect(videoMime(m=>m==='video/webm')).toBe('video/webm');expect(videoMime(()=>false)).toBeNull();
  expect(videoSize(false,8)).toEqual({width:1080,height:1920});expect(videoSize(true,8)).toEqual({width:720,height:1280});
 });
});
it('frames painted matter with a margin for pale washes',async()=>{
 const {paintingBounds}=await import('../src/dance/framing');const pixels=new Uint8ClampedArray(100*100*4).fill(255);
 for(let y=40;y<60;y++)for(let x=30;x<50;x++)pixels.set([90,70,40,255],(y*100+x)*4);
 const bounds=paintingBounds(pixels,100,100,[1,1,1]);expect(bounds.width).toBeGreaterThan(.2);expect(bounds.width).toBeLessThan(.5);
});
it('promotes the public atelier rather than a local preview',async()=>{
 const {publicSiteAddress}=await import('../src/brand');expect(publicSiteAddress('http://127.0.0.1:5173/')).not.toContain('127.0.0.1');expect(publicSiteAddress('https://example.org/atelier/')).toBe('example.org/atelier');
});
