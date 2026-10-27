"""Real GPU regression: stretch clear water, then colour one thin root locally."""
from playwright.sync_api import sync_playwright
import json,os
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('HAIKUARELLE_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=browser.new_page();page.set_default_timeout(60000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script('''for(const C of [WebGLRenderingContext,WebGL2RenderingContext]){const get=C.prototype.getParameter;C.prototype.getParameter=function(p){return p===this.MAX_TEXTURE_SIZE?Math.min(256,get.call(this,p)):get.call(this,p)}}''')
 page.goto(os.getenv('HAIKUARELLE_URL','http://127.0.0.1:5173/'))
 result=page.evaluate('''async()=>{
  const {HaikuarelleEngine}=await import('/src/engine/WatercolorEngine.ts');
  const {SoundStain}=await import('/src/birds/SoundStain.ts');
  const {BIRD_BRUSHES}=await import('/src/birds/catalog.ts');
  const canvas=document.createElement('canvas');canvas.style='width:400px;height:700px';document.body.replaceChildren(canvas);
  const e=new HaikuarelleEngine(canvas,{palette:'plumages',format:'portrait'},undefined,undefined,{requireAudio:true});e.beginSignature(7);e.pause();
  const p=e.paint,g=p.gl,w=p.field[0].w,h=p.field[0].h,unit=p.meta.unit*p.k;
  const read=()=>{g.bindFramebuffer(g.FRAMEBUFFER,p.field[0].fbo);const a=new Float32Array(w*h*4);g.readPixels(0,0,w,h,g.RGBA,g.FLOAT,a);return a;};
  const initial=new Float32Array(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const main=Math.hypot(x-w*.5,y-h*.5)<unit*.13,reserve=Math.hypot(x-w*.45,y-h*.2)<unit*.035;
   initial[(y*w+x)*4+1]=main||reserve?.45:0;
  }
  p.stopFlow();p.wetUntil=Infinity;g.bindTexture(g.TEXTURE_2D,p.field[0].tex);g.texSubImage2D(g.TEXTURE_2D,0,0,0,w,h,g.RGBA,g.FLOAT,initial);
  const stats=a=>{let volume=0,area=0,pigment=0;for(let i=0;i<a.length;i+=4){volume+=a[i+1];if(a[i+1]>=.006)area++;pigment+=a[i];}return {volume,area,meanThickness:volume/area,pigment};};
  const before=stats(read());
  for(let i=0;i<30;i++){
   const x=w*.5+unit*(-.07+i*.002),y=h*.5;
   p.step(1/30,i*1000/30,[{ax:x,ay:y,bx:x,by:y,radius:unit*.13,target:0,strength:0,waterAmount:0,kind:1,slot:0,fx:unit*.2,fy:0,coupling:.8,breath:true}],[]);
  }
  const water=read(),after=stats(water);let thinRoots=0,chosen=-1,score=-Infinity;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4,depth=water[i+1];
   if(initial[i+1]===0&&depth>=.009&&depth<=.02&&x>w*.6){
    thinRoots++;if(x>score){score=x;chosen=y*w+x;}
   }
  }
  if(chosen<0)throw new Error('No thin root produced');
  const origin={x:(chosen%w+.5)/w,y:1-(Math.floor(chosen/w)+.5)/h};
  const snapshot=p.captureMoisture();e.wetPaper.replaceMoisture(snapshot,0);
  const guideAt=e.waterAt(origin),region=e.wetPaper.region(origin,0,80);
  const bird={...BIRD_BRUSHES.find(b=>b.id==='rougegorge'),pigmentSlot:1};
  const stain=new SoundStain(bird,12,origin,{...e.settings,ink:0},e.wetPaper,.35);
  let nonWetSegments=0;
  for(let i=0;i<12;i++){
   const time=i/30,frame=stain.step({time,active:true,energy:.7,flux:.1,brightness:.5},time);
   nonWetSegments+=frame.segments.filter(s=>!s.wetOnly).length;
   const segs=frame.segments.map(s=>({ax:s.a.x*w,ay:(1-s.a.y)*h,bx:s.b.x*w,by:(1-s.b.y)*h,radius:s.radius*unit,target:s.load,strength:s.strength,waterAmount:0,kind:0,slot:s.slot,wetOnly:s.wetOnly,fx:(s.b.x-s.a.x)*w*30*.65,fy:-(s.b.y-s.a.y)*h*30*.65,coupling:s.coupling}));
   p.step(1/30,1100+i*1000/30,segs,[]);
  }
  const coloured=read();let colouredArea=0,pigmentOnRoots=0,dryPigment=0,waterDelta=0,reservePigment=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4;waterDelta=Math.max(waterDelta,Math.abs(coloured[i+1]-water[i+1]));
   if(coloured[i]>.002)colouredArea++;
   if(initial[i+1]===0&&water[i+1]>=.006)pigmentOnRoots+=coloured[i];
   if(water[i+1]<.001)dryPigment=Math.max(dryPigment,coloured[i]);
   if(Math.hypot(x-w*.45,y-h*.2)<unit*.035)reservePigment+=coloured[i];
  }
  const error=g.getError();e.destroy();return {before,after,thinRoots,guideAt,reachableSites:region.sites.length,nonWetSegments,colouredArea,pigmentOnRoots,dryPigment,waterDelta,reservePigment,error};
 }''')
 assert abs(result['after']['volume']/result['before']['volume']-1)<.02,result
 assert result['after']['area']>result['before']['area']*1.3,result
 assert result['after']['meanThickness']<result['before']['meanThickness']*.75,result
 assert result['after']['pigment']==0 and result['thinRoots']>10,result
 assert result['guideAt']>=.006 and result['reachableSites']>0,result
 assert result['nonWetSegments']==0 and result['pigmentOnRoots']>.01,result
 assert 0<result['colouredArea']<result['after']['area']*.3,result
 assert result['waterDelta']==0 and result['reservePigment']==0 and result['dryPigment']<.002,result
 assert result['error']==0 and not errors,(result,errors)
 print(json.dumps(result),flush=True);browser.close()
