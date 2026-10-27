"""Two audible voices transport existing water and pigment together, without crossing dry cuts."""
from playwright.sync_api import sync_playwright
import json,os
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=browser.new_page();page.set_default_timeout(90000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script('''for(const C of [WebGLRenderingContext,WebGL2RenderingContext]){const get=C.prototype.getParameter;C.prototype.getParameter=function(p){return p===this.MAX_TEXTURE_SIZE?Math.min(128,get.call(this,p)):get.call(this,p)}}''')
 page.goto(os.getenv('HAIKUARELLE_URL','http://127.0.0.1:5173/'))
 result=page.evaluate('''async()=>{
 const {HaikuarelleEngine}=await import('/src/engine/WatercolorEngine.ts');const canvas=document.createElement('canvas');document.body.replaceChildren(canvas);
 const e=new HaikuarelleEngine(canvas,{palette:'plumages',format:'a4'},undefined,undefined,{requireAudio:true,exhibition:true});e.beginSignature(5);e.pause();
 const p=e.paint,g=p.gl,w=p.fieldW,h=p.fieldH,u=p.meta.unit*p.k;
 const seg={ax:w*.4,ay:h*.5,bx:w*.4,by:h*.5,radius:u*.14,target:0,strength:.4,kind:1,slot:0,waterAmount:1,fx:0,fy:0,coupling:0};
 p.setLifeTime(0);p.step(1/30,0,[seg],[]);
 const initial=new Float32Array(w*h*4);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4,main=Math.hypot(x-w*.4,y-h*.5)<u*.15,reserve=Math.hypot(x-w*.8,y-h*.5)<u*.045;
  const water=main?.2+.25*(x/w):reserve?.45:0;initial[i]=water*.6;initial[i+1]=water;initial[i+2]=initial[i]*.4;initial[i+3]=initial[i]*.2;
  if(x<w*.06&&y<h*.06){initial[i]=.2;initial[i+2]=.08;initial[i+3]=.04;}
 }
 for(const target of [p.field[0],p.cohorts[0].target]){g.bindTexture(g.TEXTURE_2D,target.tex);g.texSubImage2D(g.TEXTURE_2D,0,0,0,w,h,g.RGBA,g.FLOAT,initial);}
 const voice={...seg,strength:0,waterAmount:0,resonant:true,fx:u*.04,fy:u*.012,coupling:.3};
 const answer={...voice,ax:w*.48,ay:h*.5,bx:w*.48,by:h*.5,fx:-u*.015,fy:u*.025,coupling:.18};
 for(let t=1;t<=30;t++){p.setLifeTime(t/30);p.step(1/30,t*1000/30,[voice,answer],[]);}
 g.bindFramebuffer(g.FRAMEBUFFER,p.field[0].fbo);const after=new Float32Array(w*h*4);g.readPixels(0,0,w,h,g.RGBA,g.FLOAT,after);
 let waterBefore=0,waterAfter=0,pigmentBefore=0,pigmentAfter=0,waterChange=0,ratioError=0,reserveChange=0,dryChange=0,outsideWater=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4;
  waterBefore+=initial[i+1];waterAfter+=after[i+1];pigmentBefore+=initial[i];pigmentAfter+=after[i];
  waterChange=Math.max(waterChange,Math.abs(initial[i+1]-after[i+1]));
  if(after[i+1]>.01)ratioError=Math.max(ratioError,Math.abs(after[i]/after[i+1]-.6));
  if(x>w*.7)for(let j=0;j<4;j++)reserveChange=Math.max(reserveChange,Math.abs(initial[i+j]-after[i+j]));
  if(initial[i+1]===0)outsideWater=Math.max(outsideWater,after[i+1]);
  if(x<w*.06&&y<h*.06)dryChange=Math.max(dryChange,Math.abs(initial[i]-after[i]));
 }
 const error=g.getError();e.destroy();return {waterBefore,waterAfter,pigmentBefore,pigmentAfter,waterChange,ratioError,reserveChange,dryChange,outsideWater,error};
 }''')
 assert result['waterChange']>.02,result
 assert abs(result['waterAfter']/result['waterBefore']-1)<.02,result
 assert abs(result['pigmentAfter']/result['pigmentBefore']-1)<.02,result
 assert result['ratioError']<.03 and result['reserveChange']<.001 and result['dryChange']<.001 and result['outsideWater']==0,result
 assert result['error']==0 and not errors,(result,errors)
 print(json.dumps(result),flush=True);browser.close()
