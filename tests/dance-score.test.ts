import {describe,it,expect} from 'vitest';
import {DANCE_TOOLS,addGesture,gestureFor,soundAt,videoMime,videoSize,type DanceGesture} from '../src/dance/score';
import type {AudioAnalysis} from '../src/audio/types';
describe('nine-second resonant choreography',()=>{
 it('offers five distinct tools and bounded, hardware-independent gesture storage',()=>{
  expect(new Set(DANCE_TOOLS.map(t=>t.id)).size).toBe(5);
  const score:DanceGesture[]=[];
  for(let i=0;i<9000;i++)addGesture(score,{time:i/1000,x:2,y:-1,strength:3,tool:'wave'});
  expect(score.length).toBeLessThanOrEqual(270);expect(score[0].x).toBe(1);expect(score[0].y).toBe(0);
  const before=score.length;addGesture(score,{time:9,x:0,y:0,strength:1,tool:'twist'});addGesture(score,{time:NaN,x:0,y:0,strength:1,tool:'wave'});expect(score).toHaveLength(before);
 });
 it('replays each tool independently, without responding to future gestures',()=>{
  const score:DanceGesture[]=[{time:1,x:.2,y:.7,tool:'attract',strength:1},{time:2,x:.8,y:.1,tool:'twist',strength:.8}];
  expect(gestureFor(score,'attract',.9)[2]).toBe(0);expect(gestureFor(score,'attract',1)).toEqual([.2,.7,1]);
  expect(gestureFor(score,'twist',1)[2]).toBe(0);expect(gestureFor(score,'attract',2)[2]).toBeLessThan(.2);expect(gestureFor(score,'attract',9)[2]).toBe(0);
  expect(gestureFor(score,'twist',2)).toEqual(gestureFor(JSON.parse(JSON.stringify(score)),'twist',2));
 });
 it('keeps silent gaps and the six-second promotion silent',()=>{
  const analysis={duration:1,frames:Array.from({length:30},()=>({energy:.8,bass:.4,treble:.3,flux:.2}))} as AudioAnalysis;
  expect(soundAt(analysis,.5).energy).toBe(.8);expect(soundAt(analysis,1.2).energy).toBe(0);expect(soundAt(analysis,1.5).energy).toBe(.8);
  expect(soundAt(analysis,9).energy).toBe(0);expect(soundAt(analysis,14).energy).toBe(0);
 });
 it('prefers MP4 when supported, falls back honestly and adapts mobile resolution',()=>{
  expect(videoMime(m=>m==='video/mp4;codecs=avc1.42E01E,mp4a.40.2')).toContain('avc1');expect(videoMime(m=>m==='video/mp4')).toBeNull();expect(videoMime(m=>m==='video/webm')).toBe('video/webm');expect(videoMime(()=>false)).toBeNull();
  expect(videoSize(false,8)).toEqual({width:1080,height:1920});expect(videoSize(true,8)).toEqual({width:720,height:1280});expect(videoSize(false,2).width).toBe(720);
 });
});

it('frames painted matter rather than empty paper, keeping room for washes',async()=>{
 const {paintingBounds}=await import('../src/dance/framing');const pixels=new Uint8ClampedArray(100*100*4).fill(255);
 for(let y=40;y<60;y++)for(let x=30;x<50;x++)pixels.set([90,70,40,255],(y*100+x)*4);
 const bounds=paintingBounds(pixels,100,100,[1,1,1]);expect(bounds.x).toBeLessThan(.3);expect(bounds.y).toBeLessThan(.4);expect(bounds.width).toBeGreaterThan(.2);expect(bounds.width).toBeLessThan(.5);
 expect(paintingBounds(new Uint8ClampedArray(16).fill(255),2,2,[1,1,1])).toEqual({x:0,y:0,width:1,height:1});
});

it('maps gestures onto the portrait film even inside a letterboxed mobile element',async()=>{
 const {dancePoint}=await import('../src/dance/framing');const rect={left:10,top:20,width:300,height:280};
 expect(dancePoint(160,160,rect)).toEqual({x:.5,y:.5});expect(dancePoint(10,20,rect)).toEqual({x:0,y:0});expect(dancePoint(310,300,rect)).toEqual({x:1,y:1});
});

it('promotes the public atelier rather than a local preview address',async()=>{
 const {publicSiteAddress}=await import('../src/brand');expect(publicSiteAddress('http://127.0.0.1:5173/?preview')).not.toContain('127.0.0.1');expect(publicSiteAddress('https://example.org/atelier/?preview=1')).toBe('example.org/atelier');
});
