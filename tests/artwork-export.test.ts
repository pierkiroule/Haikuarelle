import {afterEach,describe,expect,it,vi} from 'vitest';
import {exportSignatureCard} from '../src/birds/export';
afterEach(()=>vi.unstubAllGlobals());
describe('finished artwork PNG',()=>{
  it('keeps title above the complete painting and all three verses below, at native resolution',async()=>{
    const image={width:2304,height:4096,close:vi.fn()};
    const ctx={fillRect:vi.fn(),drawImage:vi.fn(),fillText:vi.fn<(text:string,x:number,y:number,maxWidth?:number)=>void>(),fillStyle:'',textAlign:'',font:''};
    const canvas={width:0,height:0,getContext:()=>ctx,toBlob:(cb:BlobCallback)=>cb(new Blob(['png'],{type:'image/png'}))};
    vi.stubGlobal('createImageBitmap',vi.fn(async()=>image));vi.stubGlobal('document',{createElement:()=>canvas});
    const verses=['Un ciel dans la main','Le bleu garde un peu de ciel','Le blanc nous répond'];
    const blob=await exportSignatureCard(new Blob(),verses,'#f7f4ec',42,'Pier','Souffle d’azur');
    expect(blob.type).toBe('image/png');expect(canvas.width).toBe(2304);expect(canvas.height).toBe(5110);
    expect(ctx.drawImage).toHaveBeenCalledWith(image,0,369);
    const calls=ctx.fillText.mock.calls;expect(calls[0][0]).toBe('Souffle d’azur');expect(calls[0][2]).toBeLessThan(369);
    expect(calls.slice(1,4).map(c=>c[0])).toEqual(verses);expect(calls.slice(1).every(c=>c[2]>4096+369)).toBe(true);
    expect(calls[4][0]).toContain('Pour Pier');expect(calls[4][0]).toContain("Haïkuarelle des trois oiseaux");expect(image.close).toHaveBeenCalledOnce();
  });
  it('releases the bitmap if encoding fails',async()=>{
    const image={width:100,height:160,close:vi.fn()};
    const ctx={fillRect(){},drawImage(){},fillText(){}};
    vi.stubGlobal('createImageBitmap',async()=>image);vi.stubGlobal('document',{createElement:()=>({getContext:()=>ctx,toBlob:(cb:BlobCallback)=>cb(null)})});
    await expect(exportSignatureCard(new Blob(),['a','b','c'],'#fff',42,'','Titre')).rejects.toThrow('Export impossible');
    expect(image.close).toHaveBeenCalledOnce();
  });
});
