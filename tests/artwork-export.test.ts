import {afterEach,describe,expect,it,vi} from 'vitest';
import {exportResonantArtwork} from '../src/birds/export';
afterEach(()=>vi.unstubAllGlobals());
describe('placed haiku and signature export',()=>{
 it('keeps the whole painting and exports only the placed verses and the signature at native resolution',async()=>{
  const image={width:2896,height:4096,close:vi.fn()};const ctx={drawImage:vi.fn(),fillText:vi.fn(),measureText:()=>({fontBoundingBoxAscent:20,fontBoundingBoxDescent:5}),fillStyle:'',font:'',textAlign:'',textBaseline:''};
  const canvas={width:0,height:0,getContext:()=>ctx,toBlob:(cb:BlobCallback)=>cb(new Blob(['png'],{type:'image/png'}))};
  vi.stubGlobal('createImageBitmap',async()=>image);vi.stubGlobal('document',{createElement:()=>canvas});
  const verses=['Au creux du vieux pommier','L’eau invente des racines','Le jardin retrouve ses ailes'],p={x:.12,y:.7,size:.03};
  const result=await exportResonantArtwork(new Blob(),verses,p);expect(result.type).toBe('image/png');expect([canvas.width,canvas.height]).toEqual([2896,4096]);expect(ctx.drawImage).toHaveBeenCalledWith(image,0,0);
  expect(ctx.fillText.mock.calls.map(c=>c[0])).toEqual([...verses,'•°○']);expect(ctx.fillText.mock.calls[0][1]).toBe(p.x*2896);
  expect(ctx.fillText.mock.calls[1][2]-ctx.fillText.mock.calls[0][2]).toBeCloseTo(p.size*2896*1.6);expect(image.close).toHaveBeenCalledOnce();
 });
 it('releases the bitmap if encoding fails',async()=>{
  const image={width:100,height:160,close:vi.fn()},ctx={drawImage(){},fillText(){},measureText:()=>({})};
  vi.stubGlobal('createImageBitmap',async()=>image);vi.stubGlobal('document',{createElement:()=>({getContext:()=>ctx,toBlob:(cb:BlobCallback)=>cb(null)})});
  await expect(exportResonantArtwork(new Blob(),['a','b','c'],{x:.1,y:.7,size:.03})).rejects.toThrow('Export impossible');expect(image.close).toHaveBeenCalledOnce();
 });
});
