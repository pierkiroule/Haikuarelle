"""Optional real GPU regression: npm run dev; Python Playwright and Chromium required."""
from playwright.sync_api import sync_playwright
import json,os
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('HAIKUARELLE_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=browser.new_page();page.set_default_timeout(60000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script('''for(const C of [WebGLRenderingContext,WebGL2RenderingContext]){const get=C.prototype.getParameter;C.prototype.getParameter=function(p){return p===this.MAX_TEXTURE_SIZE?Math.min(192,get.call(this,p)):get.call(this,p)}}''')
 page.goto(os.getenv('HAIKUARELLE_URL','http://127.0.0.1:5173/'))
 result=page.evaluate('''async()=>{
  const {HaikuarelleEngine}=await import('/src/engine/WatercolorEngine.ts');
  const canvas=document.createElement('canvas');canvas.style='width:300px;height:500px';document.body.replaceChildren(canvas);
  const e=new HaikuarelleEngine(canvas,{palette:'plumages',format:'portrait'},undefined,undefined,{requireAudio:true});e.beginSignature(7);e.pause();e.setDrying(true);
  const p=e.paint,g=p.gl,w=p.field[0].w,h=p.field[0].h;
  const read=()=>{g.bindFramebuffer(g.FRAMEBUFFER,p.field[0].fbo);const a=new Float32Array(w*h*4);g.readPixels(0,0,w,h,g.RGBA,g.FLOAT,a);return a;};
  const initial=new Float32Array(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4,wet=x>w*.2&&x<w*.75&&y>h*.25&&y<h*.75;
   const line=Math.exp(-(((y-h*.5-5*Math.sin(x*.12))/1.4)**2))*.4;
   initial[i]=wet?line:x>w*.85?.2:0;initial[i+1]=wet?.12:0;initial[i+2]=initial[i]*.4;initial[i+3]=initial[i]*.2;
  }
  const uniform=g.uniform1f.bind(g),fix=p.progs.fieldStep.u.uFixation;
  const run=enabled=>{
   p.stopFlow();p.wetUntil=Infinity;
   g.uniform1f=(location,value)=>uniform(location,location===fix&&!enabled?0:value);
   g.bindTexture(g.TEXTURE_2D,p.field[0].tex);g.texSubImage2D(g.TEXTURE_2D,0,0,0,w,h,g.RGBA,g.FLOAT,initial);
   for(let i=0;i<90;i++)p.step(1/30,i*1000/30,[],[]);
   const a=read();let contrast=0,mass=0,dryDelta=0,water=0;
   for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
    const i=(y*w+x)*4;if(x>w*.85)dryDelta=Math.max(dryDelta,Math.abs(a[i]-initial[i]));
    if(x>w*.2&&x<w*.75){mass+=a[i];contrast+=(a[i]-a[i+4])**2+(a[i]-a[i+w*4])**2;water+=a[i+1];}
   }
   return {contrast,mass,dryDelta,water};
  };
  const previous=run(false),fixed=run(true);g.uniform1f=uniform;
  const error=g.getError();e.destroy();return {previous,fixed,error};
 }''')
 assert result['fixed']['contrast']>result['previous']['contrast']*1.15,result
 assert abs(result['fixed']['mass']/result['previous']['mass']-1)<.025,result
 assert result['fixed']['water']==result['previous']['water'],result
 assert result['fixed']['dryDelta']==result['previous']['dryDelta'] and result['fixed']['dryDelta']<1e-4 and result['error']==0 and not errors,(result,errors)
 print(json.dumps(result),flush=True);browser.close()
