import {describe,expect,it,vi} from 'vitest';
import {SoundDeposit} from '../src/birds/SoundDeposit';
import {BIRD_BRUSHES} from '../src/birds/catalog';
import type {BirdAudioBank,BirdPlayback} from '../src/birds/BirdAudioBank';
function setup(water=.45){
  let start:(s:BirdPlayback)=>void=()=>{},end=()=>{},resolve=()=>{},reject:(e:Error)=>void=()=>{};
  const sound={analysis:{frames:[{active:true}]},elapsed:()=>.2} as unknown as BirdPlayback;
  const sounds={stop:vi.fn(),play:vi.fn<BirdAudioBank['play']>((_id,onStart,onEnd)=>{start=onStart;end=onEnd;return new Promise<void>((ok,no)=>{resolve=ok;reject=no;});})};
  const painter={waterAt:vi.fn(()=>water),startSoundStain:vi.fn(()=>true),stopBird:vi.fn()};
  const callbacks={preparing:vi.fn(),started:vi.fn(),stopped:vi.fn(),marked:vi.fn(),error:vi.fn()};
  const deposit=new SoundDeposit(sounds,painter,callbacks);
  return {deposit,sounds,painter,callbacks,start:()=>{start(sound);resolve();},end:()=>end(),fail:()=>reject(new Error('Lecture bloquée'))};
}
const bird=BIRD_BRUSHES[2],point={x:.4,y:.5};
describe('a deposited phrase has its own lifetime',()=>{
  it('plays once without a loop and passes the fixed origin and opacity only after sound starts',async()=>{
    const t=setup(),pending=t.deposit.place(bird,point,7,.6,2,.3);
    expect(t.deposit.busy).toBe(true);expect(t.painter.startSoundStain).not.toHaveBeenCalled();
    t.start();await pending;
    expect(t.sounds.play.mock.calls[0][3]).toBeUndefined();
    expect(t.painter.startSoundStain.mock.calls[0]).toMatchObject([expect.anything(),bird,point,7,.6,2,expect.any(Function),expect.any(Function),.3]);
    expect(t.deposit.busy).toBe(true);expect(t.sounds.stop).not.toHaveBeenCalled();
    t.end();expect(t.deposit.busy).toBe(false);expect(t.painter.stopBird).toHaveBeenCalledOnce();
  });
  it('rejects overlapping deposits without cutting the sounding sample',async()=>{
    const t=setup(),pending=t.deposit.place(bird,point,7,.6,0);t.start();await pending;
    await t.deposit.place(BIRD_BRUSHES[0],{x:.7,y:.6},8,.6,1);
    expect(t.sounds.play).toHaveBeenCalledOnce();expect(t.sounds.stop).not.toHaveBeenCalled();
    expect(t.callbacks.error).toHaveBeenCalled();t.end();
    const next=t.deposit.place(bird,point,8,.6,1);t.start();await next;expect(t.sounds.play).toHaveBeenCalledTimes(2);
  });
  it('rejects dry paper before playing any sound',async()=>{
    const t=setup(0);await t.deposit.place(bird,point,7,.6,0);
    expect(t.sounds.play).not.toHaveBeenCalled();expect(t.deposit.busy).toBe(false);expect(t.callbacks.error).toHaveBeenCalled();
  });
  it('does not resurrect a deposit cancelled while its sample decodes',async()=>{
    const t=setup(),pending=t.deposit.place(bird,point,7,.6,0);t.deposit.cancel();t.start();await pending;
    expect(t.painter.startSoundStain).not.toHaveBeenCalled();expect(t.callbacks.started).not.toHaveBeenCalled();expect(t.deposit.busy).toBe(false);
  });
  it('releases the deposit after a playback failure',async()=>{
    const t=setup(),pending=t.deposit.place(bird,point,7,.6,0);t.fail();await pending;
    expect(t.deposit.busy).toBe(false);expect(t.callbacks.error).toHaveBeenCalledWith('Lecture bloquée');
  });
});
