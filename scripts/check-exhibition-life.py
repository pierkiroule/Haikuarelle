"""Real WebGL temporal layers: shared water, independent pigment ages and bounded reuse."""
from playwright.sync_api import sync_playwright
import json,os
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=browser.new_page();page.set_default_timeout(120000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script('''for(const C of [WebGLRenderingContext,WebGL2RenderingContext]){const get=C.prototype.getParameter;C.prototype.getParameter=function(p){return p===this.MAX_TEXTURE_SIZE?Math.min(128,get.call(this,p)):get.call(this,p)}}''')
 page.goto(os.getenv('HAIKUARELLE_URL','http://127.0.0.1:5173/'))
 result=page.evaluate('''async()=>{
 const {HaikuarelleEngine}=await import('/src/engine/WatercolorEngine.ts');
 const c=document.createElement('canvas');c.style='width:300px;height:300px';document.body.replaceChildren(c);
 const e=new HaikuarelleEngine(c,{palette:'plumages',format:'a4'},undefined,undefined,{requireAudio:true,exhibition:true});e.beginSignature(7);e.pause();e.setBirdPalette('mesange');
 const p=e.paint,g=p.gl,w=p.fieldW,h=p.fieldH,unit=p.meta.unit*p.k;
 const read=(target=p.field[0])=>{g.bindFramebuffer(g.FRAMEBUFFER,target.fbo);const a=new Float32Array(w*h*4);g.readPixels(0,0,w,h,g.RGBA,g.FLOAT,a);return a;};
 const stats=a=>{let pigment=0,water=0;for(let i=0;i<a.length;i+=4){pigment+=a[i];water+=a[i+1];}return {pigment,water};};
 const segment=(kind,slot=0)=>({ax:w*.5,ay:h*.5,bx:w*.51,by:h*.5,radius:unit*.13,target:kind===1?1:.65,strength:.45,kind,slot,waterAmount:kind===1?1:undefined,fx:0,fy:0,coupling:0});
 let tick=0;const step=(t,segs=[])=>{p.setLifeTime(t);p.step(1/30,++tick*1000/30,segs,[]);};
 step(0,[segment(1),segment(0,0)]);const fresh=stats(read());
 step(10);const wet=stats(read());step(21);const dry=stats(read());
 if(dry.water>1e-4)throw Error('Old water did not dry');
 const oldEpoch=p.cohorts[0].epoch;const oldMass=stats(read(p.cohorts[0].target)).pigment;
 step(30,[segment(1),segment(0,3)]);const rewetted=stats(read());
 const oldAfterRewet=stats(read(p.cohorts.find(c=>c.epoch===oldEpoch).target));
 step(50);const fading=stats(read());
 step(60);const surviving=p.cohorts.map(c=>c.epoch);const newer=stats(read());
 if(surviving.includes(oldEpoch)||newer.pigment<=0)throw Error('New pigment refreshed old pigment or disappeared with it');
 step(91);const empty=stats(read());
 let peak=0;for(let i=31;i<100;i++){step(i*3,[segment(1),segment(0,i%6)]);peak=Math.max(peak,p.temporalStats.allocated);}
 const bounded=p.temporalStats;step(400);const final=stats(read());const error=g.getError();e.destroy();
 return {fresh,wet,dry,rewetted,oldMass,oldAfterRewet,fading,surviving,newer,empty,peak,bounded,final,error};
 }''')
 assert result['fresh']['pigment']>0 and result['fresh']['water']>0,result
 assert result['wet']['water']>result['fresh']['water']*.95,result
 assert result['dry']['pigment']>result['fresh']['pigment']*.9,result
 assert result['oldAfterRewet']['water']==0,result
 assert abs(result['oldAfterRewet']['pigment']/result['oldMass']-1)<.03,result
 assert result['empty']=={'pigment':0,'water':0} and result['final']==result['empty'],result
 assert result['peak']<=result['bounded']['capacity']+1,result
 assert result['error']==0 and not errors,(result,errors)
 print(json.dumps(result),flush=True);browser.close()
