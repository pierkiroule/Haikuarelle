import {describe,expect,it,vi} from 'vitest';
import {DirectBrush} from '../src/birds/DirectBrush';
import {BIRD_BRUSHES} from '../src/birds/catalog';
import type {BirdPlayback,BirdAudioBank} from '../src/birds/BirdAudioBank';

function open(){
  let start:(sound:BirdPlayback)=>void=()=>{},ended:()=>void=()=>{};
  let resolve:()=>void=()=>{},reject:(error:Error)=>void=()=>{};
  const sound={analysis:{frames:[{active:true}]},elapsed:()=>.2} as unknown as BirdPlayback;
  const bank={stop:vi.fn(),play:vi.fn<BirdAudioBank['play']>((_id,onStart,onEnd,_options)=>{start=onStart;ended=onEnd;return new Promise<void>((ok,fail)=>{resolve=ok;reject=fail;});})};
  const engine={startBirdBrush:vi.fn(()=>true),moveBrush:vi.fn(),liftBrush:vi.fn(),stopBird:vi.fn()};
  const callbacks={preparing:vi.fn(),started:vi.fn(),stopped:vi.fn(),marked:vi.fn(),error:vi.fn()};
  const brush=new DirectBrush(bank,engine,callbacks);
  return {brush,bank,engine,callbacks,start:()=>{start(sound);resolve();},endSound:()=>ended(),fail:()=>reject(new Error('Lecture bloquée')),resolve:()=>resolve()};
}
describe('one direct contact owns audio, water and pigment',()=>{
  it('waits for actual source start, then uses the latest point without replaying a path buffered during loading',async()=>{
    const t=open(),pending=t.brush.begin(BIRD_BRUSHES[3],{x:.2,y:.3},10,.5,8,.7,0);
    t.brush.move({x:.6,y:.7},60,.8);
    expect(t.engine.moveBrush).not.toHaveBeenCalled();expect(t.engine.startBirdBrush).not.toHaveBeenCalled();
    t.start();await pending;
    expect(t.engine.moveBrush).toHaveBeenCalledExactlyOnceWith({x:.6,y:.7},60,.8);
    expect(t.bank.play.mock.calls[0][3]).toEqual({loop:true,breath:.28});
    t.brush.move({x:.7,y:.7},80,.6);expect(t.engine.moveBrush).toHaveBeenLastCalledWith({x:.7,y:.7},80,.6);
  });
  it('passes the selected brush opacity through audio startup to the painter',async()=>{
    const t=open(),pending=t.brush.begin(BIRD_BRUSHES[7],{x:.3,y:.4},10,.5,8,.8,0,.27);
    t.start();await pending;
    expect(t.engine.startBirdBrush.mock.calls[0]).toHaveLength(8);
    expect((t.engine.startBirdBrush.mock.calls[0] as unknown[])[7]).toBe(.27);
  });
  it('never resurrects a released touch after a late decode or a late source callback',async()=>{
    const t=open(),pending=t.brush.begin(BIRD_BRUSHES[0],{x:.2,y:.3},10,.5,8,.7,0);
    t.brush.end();t.start();await pending;t.brush.move({x:.9,y:.9},100);
    expect(t.engine.startBirdBrush).not.toHaveBeenCalled();expect(t.engine.moveBrush).not.toHaveBeenCalled();
    expect(t.callbacks.marked).not.toHaveBeenCalled();
  });
  it('breaks the path outside the page and cancels sound and deposits on release',async()=>{
    const t=open(),pending=t.brush.begin(BIRD_BRUSHES[1],{x:.2,y:.3},10,.5,8,.7,0);t.start();await pending;
    t.brush.breakPath();expect(t.engine.liftBrush).toHaveBeenCalledOnce();
    t.brush.end();expect(t.bank.stop).toHaveBeenCalled();expect(t.engine.stopBird).toHaveBeenCalled();
    t.engine.moveBrush.mockClear();t.brush.move({x:.9,y:.9},90);expect(t.engine.moveBrush).not.toHaveBeenCalled();
  });
  it('handles audio failure and the playback time limit without drawing or leaving a live brush',async()=>{
    const failed=open(),pending=failed.brush.begin(BIRD_BRUSHES[0],{x:.2,y:.3},10,.5,8,.7,0);failed.fail();await pending;
    expect(failed.engine.startBirdBrush).not.toHaveBeenCalled();expect(failed.callbacks.error).toHaveBeenCalledWith('Lecture bloquée');
    const t=open(),playing=t.brush.begin(BIRD_BRUSHES[0],{x:.2,y:.3},10,.5,8,.7,0);t.start();await playing;
    t.endSound();t.engine.moveBrush.mockClear();t.brush.move({x:.8,y:.8},100);expect(t.engine.moveBrush).not.toHaveBeenCalled();
  });
});
