import {describe,it,expect} from 'vitest';
import {videoMime,videoSize} from '../src/dance/score';
describe('creation film formats',()=>{
 it('chooses H264 MP4 or an honest WebM fallback and adapts resolution',()=>{
  expect(videoMime(m=>m==='video/mp4;codecs=avc1.42E01E,mp4a.40.2')).toContain('avc1');expect(videoMime(m=>m==='video/mp4')).toBeNull();expect(videoMime(m=>m==='video/webm')).toBe('video/webm');expect(videoMime(()=>false)).toBeNull();expect(videoSize(true,8)).toEqual({width:720,height:1280});
 });
});
it('promotes the public atelier rather than a local preview',async()=>{const {publicSiteAddress}=await import('../src/brand');expect(publicSiteAddress('http://127.0.0.1:5173/')).not.toContain('127.0.0.1');});
