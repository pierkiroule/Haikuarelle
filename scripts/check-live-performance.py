import os
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--enable-unsafe-swiftshader']);page=b.new_page();page.route('**/__perf',lambda r:r.fulfill(status=200,content_type='text/html',body='<!doctype html>'));page.goto('http://localhost:5173/__perf')
 result=page.evaluate('''async()=>{
 const {HaikuarelleEngine}=await import('/src/engine/WatercolorEngine.ts');const canvas=document.createElement('canvas');canvas.style.cssText='width:160px;height:226px';document.body.append(canvas);
 // Keep software-GPU validation small; compare identical work before and after.
 const proto=WebGL2RenderingContext.prototype,get=proto.getParameter;proto.getParameter=function(p){return p===this.MAX_TEXTURE_SIZE?192:get.call(this,p)};
 const engine=new HaikuarelleEngine(canvas,{palette:'plumages',format:'a4'},undefined,e=>{throw Error(e)},{requireAudio:true});engine.beginSignature(7);engine.wetBrush({x:.5,y:.5},1,.8,1);engine.deposit(.5,.5,'0');engine.pause();for(let i=0;i<6;i++)engine.stepOnce();proto.getParameter=get;
 const paint=engine.paint,counts={paper:0,flow:0,drying:0},run=paint.run.bind(paint);paint.run=(name,...args)=>{if(name in counts)counts[name]++;return run(name,...args)};
 const capture=()=>paint.capture(512/paint.viewH,0,false,true);
 capture();const warm={...counts};const before=paint.save().data;const times=[];let cached;
 for(let i=0;i<4;i++){const start=performance.now();cached=capture();times.push(performance.now()-start)}
 const bakes=Object.fromEntries(Object.keys(counts).map(k=>[k,counts[k]-warm[k]]));
 const fresh=paint.capture(512/paint.viewH,0,false);let maxDifference=0;for(let i=0;i<cached.pixels.length;i++)maxDifference=Math.max(maxDifference,Math.abs(cached.pixels[i]-fresh.pixels[i]));
 const after=paint.save().data;if(before.some((v,i)=>v!==after[i]))throw Error('Capture changed pigment/water');
 engine.beginSignature(8);engine.pause();const resetBefore={...counts};const changed=capture();if(Object.keys(counts).some(k=>counts[k]!==resetBefore[k]+1))throw Error('New sheet kept stale texture cache');let seedDifference=0;for(let i=0;i<changed.pixels.length;i++)seedDifference+=Math.abs(changed.pixels[i]-cached.pixels[i]);
 engine.wetBrush({x:.5,y:.5},2,.8,1);engine.deposit(.5,.5,'0');engine.pause();for(let i=0;i<6;i++)engine.stepOnce();
 const fieldBefore=paint.save().data;engine.liveBudget.scale=.36;engine.resize();const fieldAfter=paint.save().data;
 if(fieldBefore.some((v,i)=>v!==fieldAfter[i]))throw Error('Display budget changed wet state');
 const render=paint.render.bind(paint);let renders=0;paint.render=(...args)=>{renders++;return render(...args)};engine.request=()=>{};engine.paused=false;engine.last=0;engine.accumulator=0;
 engine.frame(1000);const firstRenders=renders;engine.frame(1010);if(renders!==firstRenders)throw Error('Rendered an unchanged simulation tick');engine.frame(1040);if(renders!==firstRenders+1)throw Error('Did not render advanced simulation');engine.pause();
 const glError=paint.gl.getError();engine.destroy();return {bakes,times,maxDifference,physicsUnchanged:true,displayResizePreservesWater:true,unchangedFramesSkipped:true,glError};}''')
 if not os.getenv('HAIKUARELLE_BASELINE'):assert all(v==0 for v in result['bakes'].values()),result
 assert result['maxDifference']==0 and result['glError']==0
 print(result,flush=True);b.close()
