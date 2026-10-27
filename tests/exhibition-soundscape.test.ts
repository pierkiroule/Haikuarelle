// @vitest-environment jsdom
import {describe,it,expect,vi} from 'vitest';
import {Soundscape} from '../src/exhibition/Soundscape';
import type {BirdAudioBank} from '../src/birds/BirdAudioBank';
import type {HaikuarelleEngine} from '../src/engine/WatercolorEngine';
function open(){
 const bank={mainBusy:false,replyBusy:false,playReply:vi.fn(async()=>{}),stopReplies:vi.fn()};
 const painter={hearLandscape:vi.fn(),forgetLandscape:vi.fn(),livingSeconds:0};
 return {bank,painter,score:new Soundscape(bank as unknown as BirdAudioBank,painter as unknown as HaikuarelleEngine)};
}
describe('bounded birds answering across visitors',()=>{
 it('waits through the foreground phrase and breathes between replies',async()=>{
  const {score,bank}=open();score.remember('mesange',{x:.2,y:.5},0);
  bank.mainBusy=true;await score.tick(8);expect(bank.playReply).not.toHaveBeenCalled();
  bank.mainBusy=false;await score.tick(8);expect(bank.playReply).toHaveBeenCalledTimes(1);
  await score.tick(9);expect(bank.playReply).toHaveBeenCalledTimes(1);
 });
 it('does not start a third voice or call after its trace is gone',async()=>{
  const {score,bank}=open();score.remember('pie',{x:.8,y:.3},0);bank.replyBusy=true;
  await score.tick(10);expect(bank.playReply).not.toHaveBeenCalled();bank.replyBusy=false;
  await score.tick(58);expect(bank.playReply).not.toHaveBeenCalled();await score.tick(60);expect(score.count).toBe(0);
 });
 it('keeps a bounded memory during sustained public participation',()=>{
  const {score}=open();for(let i=0;i<1000;i++)score.remember('geai',{x:.5,y:.5},i*.01);
  expect(score.count).toBe(32);
 });
 it('disposal invalidates pending answers and disconnects sounding replies',()=>{
  const {score,bank,painter}=open();score.remember('pie',{x:.5,y:.5},0);score.destroy();
  expect(bank.stopReplies).toHaveBeenCalled();expect(painter.forgetLandscape).toHaveBeenCalledWith('memory-1');expect(score.count).toBe(0);
 });
});
