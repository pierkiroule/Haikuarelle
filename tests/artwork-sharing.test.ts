// @vitest-environment jsdom
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {deliverArtwork} from '../src/birds/share';
let share:ReturnType<typeof vi.fn>,canShare:ReturnType<typeof vi.fn>,click:ReturnType<typeof vi.spyOn>,revoke:ReturnType<typeof vi.fn>;
beforeEach(()=>{
  vi.useFakeTimers();share=vi.fn(async()=>{});canShare=vi.fn(()=>true);revoke=vi.fn();
  vi.stubGlobal('navigator',{share,canShare});
  vi.stubGlobal('URL',{createObjectURL:vi.fn(()=> 'blob:artwork'),revokeObjectURL:revoke});
  click=vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
});
afterEach(()=>{vi.runAllTimers();vi.useRealTimers();vi.restoreAllMocks();vi.unstubAllGlobals();});
const deliver=(mode:'download'|'share'='share')=>deliverArtwork(new Blob(['png'],{type:'image/png'}),'haikuarelle.png','Les ailes du matin',mode);
describe('sharing the finished haikuarelle',()=>{
  it('shares the actual PNG and title through the native sheet',async()=>{
    expect(await deliver()).toBe('shared');expect(click).not.toHaveBeenCalled();
    const data=share.mock.calls[0][0] as ShareData;
    expect(data.title).toBe('Les ailes du matin');expect(data.text).toBe('HAÏKUARELLE des trois plumes');
    expect(data.files![0]).toMatchObject({name:'haikuarelle.png',type:'image/png',size:3});
  });
  it('does not download when the person cancels sharing',async()=>{
    share.mockRejectedValue(new DOMException('Annulé','AbortError'));
    expect(await deliver()).toBe('cancelled');expect(click).not.toHaveBeenCalled();
  });
  it('downloads the PNG if file sharing is unsupported',async()=>{
    canShare.mockReturnValue(false);expect(await deliver()).toBe('saved');
    expect(share).not.toHaveBeenCalled();expect(click).toHaveBeenCalledOnce();
    vi.runAllTimers();expect(revoke).toHaveBeenCalledWith('blob:artwork');
  });
  it('falls back to download if sharing loses browser authorization',async()=>{
    share.mockRejectedValue(new DOMException('Gesture required','NotAllowedError'));
    expect(await deliver()).toBe('saved');expect(click).toHaveBeenCalledOnce();
  });
  it('allows an explicit download even when native sharing is available',async()=>{
    expect(await deliver('download')).toBe('saved');expect(share).not.toHaveBeenCalled();expect(click).toHaveBeenCalledOnce();
  });
});
