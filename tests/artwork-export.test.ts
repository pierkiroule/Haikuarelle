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
 it('exports the title in bold italic Georgia at its own position and size',async()=>{
  const image={width:1000,height:1414,close:vi.fn()},fonts:string[]=[];
  const ctx={drawImage:vi.fn(),fillText:vi.fn(),measureText:()=>({fontBoundingBoxAscent:20,fontBoundingBoxDescent:5}),font:''};
  ctx.fillText.mockImplementation(()=>{fonts.push(ctx.font);});
  vi.stubGlobal('createImageBitmap',async()=>image);vi.stubGlobal('document',{createElement:()=>({width:0,height:0,getContext:()=>ctx,toBlob:(cb:BlobCallback)=>cb(new Blob(['png']))})});
  await exportResonantArtwork(new Blob(),['a','b','c'],{x:.1,y:.7,size:.03},{text:'Le souffle de la mésange bleue',placement:{x:.2,y:.12,size:.04}});
  expect(ctx.fillText.mock.calls.map(c=>c[0])).toEqual(['Le souffle de la mésange bleue','a','b','c','•°○']);
  expect(fonts[0]).toBe('italic bold 40px Georgia');expect(fonts[1]).toBe('30px Georgia');
  expect(ctx.fillText.mock.calls[0][1]).toBe(200);expect(ctx.fillText.mock.calls[1][1]).toBe(100);
  expect(ctx.fillText.mock.calls[0][2]).toBeLessThan(ctx.fillText.mock.calls[1][2]);
 });
 it('exports the painting transform independently of the text and signature',async()=>{
  const image={width:1000,height:1400,close:vi.fn()},ctx={drawImage:vi.fn(),fillRect:vi.fn(),fillText:vi.fn(),measureText:()=>({})};
  vi.stubGlobal('createImageBitmap',async()=>image);vi.stubGlobal('document',{createElement:()=>({getContext:()=>ctx,toBlob:(cb:BlobCallback)=>cb(new Blob(['png']))})});
  await exportResonantArtwork(new Blob(),['a','b','c'],{x:.1,y:.7,size:.03},undefined,{x:.2,y:.1,scale:.6});
  expect(ctx.fillRect).toHaveBeenCalledWith(0,0,1000,1400);
  expect(ctx.drawImage).toHaveBeenCalledWith(image,200,140,600,840);
  expect(ctx.fillText.mock.calls[0][1]).toBe(100);
  expect(ctx.fillText.mock.calls.at(-1)?.[0]).toBe('•°○');
 });
 it('preserves independent fonts, colors and line alignment in the PNG',async()=>{
  const calls:{font:string;color:string;align:string;x:number}[]=[],image={width:1000,height:1400,close:vi.fn()};
  const ctx={drawImage:vi.fn(),fillText:vi.fn(),measureText:(line:string)=>({width:line.length*10,fontBoundingBoxAscent:20,fontBoundingBoxDescent:5}),font:'',fillStyle:'',textAlign:''};
  ctx.fillText.mockImplementation((_line:string,x:number)=>{calls.push({font:ctx.font,color:ctx.fillStyle,align:ctx.textAlign,x});});
  vi.stubGlobal('createImageBitmap',async()=>image);vi.stubGlobal('document',{createElement:()=>({getContext:()=>ctx,toBlob:(cb:BlobCallback)=>cb(new Blob(['png']))})});
  await exportResonantArtwork(new Blob(),['aaaa','bb','ccc'],{x:.1,y:.7,size:.03},{text:'Titre',placement:{x:.2,y:.1,size:.04}},undefined,{title:{font:'sans',color:'#78504a',align:'right'},haiku:{font:'book',color:'#202b35',align:'center'}});
  expect(calls[0]).toEqual({font:'italic bold 40px Arial',color:'#78504a',align:'right',x:250});
  expect(calls[1].font).toContain('Palatino');expect(calls[1].color).toBe('#202b35');expect(calls[1].align).toBe('center');expect(calls.slice(1,4).map(c=>c.x)).toEqual([120,120,120]);
  expect(calls.at(-1)?.color).toBe('rgba(163,68,61,.72)');
 });
 it('releases the bitmap if encoding fails',async()=>{
  const image={width:100,height:160,close:vi.fn()},ctx={drawImage(){},fillText(){},measureText:()=>({})};
  vi.stubGlobal('createImageBitmap',async()=>image);vi.stubGlobal('document',{createElement:()=>({getContext:()=>ctx,toBlob:(cb:BlobCallback)=>cb(null)})});
  await expect(exportResonantArtwork(new Blob(),['a','b','c'],{x:.1,y:.7,size:.03})).rejects.toThrow('Export impossible');expect(image.close).toHaveBeenCalledOnce();
 });
});
