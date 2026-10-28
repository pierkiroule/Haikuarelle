import {afterEach,describe,expect,it,vi} from 'vitest';
import {exportResonantArtwork} from '../src/birds/export';
import {fixedPoetryLayout} from '../src/birds/FixedPoetry';
afterEach(()=>vi.unstubAllGlobals());
function fixture(fail=false){
 const image={width:1000,height:1414,close:vi.fn()},calls:{text:string;x:number;y:number;font:string;align:string;color:string;alpha:number}[]=[];
 const ctx={save:vi.fn(),restore:vi.fn(),drawImage:vi.fn(),fillRect:vi.fn(),fillText:vi.fn(),measureText:(line:string)=>({width:line.length*15,fontBoundingBoxAscent:30,fontBoundingBoxDescent:8}),globalAlpha:1,font:'',textAlign:'',fillStyle:''};
 ctx.fillText.mockImplementation((text:string,x:number,y:number)=>calls.push({text,x,y,font:ctx.font,align:ctx.textAlign,color:ctx.fillStyle,alpha:ctx.globalAlpha}));
 const fonts={load:vi.fn(async()=>[]),ready:Promise.resolve()};
 vi.stubGlobal('createImageBitmap',async()=>image);vi.stubGlobal('document',{fonts,createElement:()=>({width:0,height:0,getContext:()=>ctx,toBlob:(cb:BlobCallback)=>cb(fail?null:new Blob(['png'],{type:'image/png'}))})});
 return {image,ctx,calls,fonts};
}
describe('fixed handwritten poetry export',()=>{
 it('centers the title at the top and three lines at the bottom, independently of the painting',async()=>{
  const {image,ctx,calls,fonts}=fixture();
  await exportResonantArtwork(new Blob(),['a','b','c'],'Le silence de la mésange bleue',{x:.2,y:.1,scale:.6});
  expect(fonts.load).toHaveBeenCalledWith('20px "Caveat"');expect(ctx.drawImage).toHaveBeenCalledWith(image,200,141.4,600,848.4);
  expect(calls.map(c=>c.text)).toEqual(['Le silence de la mésange bleue','a','b','c','•°○']);
  for(const c of calls.slice(0,4)){expect(c.x).toBe(500);expect(c.align).toBe('center');expect(c.font).toContain('Caveat');expect(c.color).toBe('#35483e');expect(c.alpha).toBe(.8);}
  expect(calls[0].y).toBeLessThan(150);expect(calls[1].y).toBeGreaterThan(1100);expect(calls[3].y).toBeLessThan(1414*.94);expect(calls[4].alpha).toBe(1);expect(calls[4].color).toBe('rgba(163,68,61,.72)');expect(image.close).toHaveBeenCalledOnce();
 });
 it('fits long lines within the same reserved text width without wrapping',()=>{
  const l=fixedPoetryLayout((text,size)=>text.length*size*.7,'x'.repeat(60),['x'.repeat(80),'b','c']);
  expect(l.titleSize*60*.7).toBeCloseTo(.88);expect(l.verseSize*80*.7).toBeCloseTo(.88);expect(l.titleY).toBe(.045);expect(l.verseY).toBeGreaterThan(.8);
 });
 it('releases the bitmap if encoding fails',async()=>{
  const {image}=fixture(true);await expect(exportResonantArtwork(new Blob(),['a','b','c'],'Titre')).rejects.toThrow('Export impossible');expect(image.close).toHaveBeenCalledOnce();
 });
});
