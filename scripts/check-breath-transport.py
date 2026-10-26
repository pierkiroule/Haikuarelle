"""Real GPU regression: breath must move the puddle and pigment together, not clone a fringe."""
from playwright.sync_api import sync_playwright
import json,os
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('HAIKUARELLE_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=browser.new_page();page.set_default_timeout(60000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script('''for(const C of [WebGLRenderingContext,WebGL2RenderingContext]){const get=C.prototype.getParameter;C.prototype.getParameter=function(p){return p===this.MAX_TEXTURE_SIZE?Math.min(256,get.call(this,p)):get.call(this,p)}}''')
 page.goto(os.getenv('HAIKUARELLE_URL','http://127.0.0.1:5173/'))
 result=page.evaluate('''async()=>{
  const {HaikuarelleEngine}=await import('/src/engine/WatercolorEngine.ts');
  const canvas=document.createElement('canvas');canvas.style='width:400px;height:700px';document.body.replaceChildren(canvas);
  const e=new HaikuarelleEngine(canvas,{palette:'plumages',format:'portrait'},undefined,undefined,{requireAudio:true});e.beginSignature(7);e.pause();
  const p=e.paint,g=p.gl,w=p.field[0].w,h=p.field[0].h,unit=p.meta.unit*p.k;
  const read=()=>{g.bindFramebuffer(g.FRAMEBUFFER,p.field[0].fbo);const a=new Float32Array(w*h*4);g.readPixels(0,0,w,h,g.RGBA,g.FLOAT,a);return a;};
  const run=dir=>{
   const initial=new Float32Array(w*h*4),center={x:w*.5,y:h*.5};
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4,wet=Math.hypot(x-center.x,y-center.y)<unit*.13;
    initial[i]=wet?.27:x<w*.08&&y>h*.9?.2:0;initial[i+1]=wet?.45:0;initial[i+2]=initial[i]*.4;initial[i+3]=initial[i]*.2;
   }
   p.stopFlow();p.wetUntil=Infinity;g.bindTexture(g.TEXTURE_2D,p.field[0].tex);g.texSubImage2D(g.TEXTURE_2D,0,0,0,w,h,g.RGBA,g.FLOAT,initial);
   const stats=a=>{
    let water=0,pigment=0,wx=0,wy=0,px=0,py=0,donor=0,dryDelta=0,colourError=0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
     const i=(y*w+x)*4;
     if(x<w*.08&&y>h*.9){dryDelta=Math.max(dryDelta,Math.abs(a[i]-initial[i]));continue;}
     water+=a[i+1];pigment+=a[i];wx+=a[i+1]*x;wy+=a[i+1]*y;px+=a[i]*x;py+=a[i]*y;
     if((x-center.x)*dir.x+(y-center.y)*dir.y<-unit*.04)donor+=a[i+1];
     if(a[i+1]>.015)colourError=Math.max(colourError,Math.abs(a[i]/a[i+1]-.6));
    }
    return {water,pigment,waterCenter:[wx/water,wy/water],pigmentCenter:[px/pigment,py/pigment],donor,dryDelta,colourError};
   };
   const before=stats(read());
   for(let i=0;i<30;i++){
    const x=center.x+dir.x*unit*(-.07+i*.002),y=center.y+dir.y*unit*(-.07+i*.002);
    p.step(1/30,i*1000/30,[{ax:x,ay:y,bx:x,by:y,radius:unit*.13,target:0,strength:0,waterAmount:0,kind:1,slot:0,fx:dir.x*unit*.2,fy:dir.y*unit*.2,coupling:.8,breath:true}],[]);
   }
   const after=stats(read()),residualAirFlow=p.flowUntil>1000,shift=(after.waterCenter[0]-before.waterCenter[0])*dir.x+(after.waterCenter[1]-before.waterCenter[1])*dir.y;
   const alignment=Math.hypot(after.waterCenter[0]-after.pigmentCenter[0],after.waterCenter[1]-after.pigmentCenter[1]);
   return {before,after,shift,alignment,unit,residualAirFlow};
  };
  const horizontal=run({x:1,y:0}),vertical=run({x:0,y:1});const error=g.getError();e.destroy();return {horizontal,vertical,error};
 }''')
 for direction in ['horizontal','vertical']:
  r=result[direction]
  assert not r['residualAirFlow'],(direction,r)
  assert r['shift']>r['unit']*.025,(direction,r)
  assert r['after']['donor']<r['before']['donor']*.85,(direction,r)
  assert r['alignment']<.3 and r['after']['colourError']<.03,(direction,r)
  assert abs(r['after']['water']/r['before']['water']-1)<.02,(direction,r)
  assert abs(r['after']['pigment']/r['before']['pigment']-1)<.02,(direction,r)
  assert r['after']['dryDelta']<1e-4,(direction,r)
 assert result['error']==0 and not errors,(result,errors)
 print(json.dumps(result),flush=True);browser.close()
