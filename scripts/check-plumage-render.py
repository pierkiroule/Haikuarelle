"""Optional real-WebGL regression. Start npm run dev first.
Requires Python Playwright and Chromium. Override HAIKUARELLE_URL and
HAIKUARELLE_CHROMIUM if needed. Captures are written to /tmp.
"""
from playwright.sync_api import sync_playwright
import os,json
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.getenv('HAIKUARELLE_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=b.new_page(viewport={'width':720,'height':1080});page.set_default_timeout(60000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script('''for(const C of [WebGLRenderingContext,WebGL2RenderingContext]){const orig=C.prototype.getParameter;C.prototype.getParameter=function(p){return p===this.MAX_TEXTURE_SIZE?Math.min(256,orig.call(this,p)):orig.call(this,p)}}''')
 page.goto(os.getenv('HAIKUARELLE_URL','http://127.0.0.1:5173/'))
 grid=page.evaluate('''async()=>{
 const {HaikuarelleEngine}=await import('/src/engine/WatercolorEngine.ts');
 const c=document.createElement('canvas');c.style='width:600px;height:1000px';document.body.replaceChildren(c);
 const e=new HaikuarelleEngine(c,{palette:'plumages',format:'portrait',wetness:.6},undefined,undefined,{requireAudio:true});e.beginSignature(123);e.pause();const p=e.paint,g=p.gl,w=p.field[0].w,h=p.field[0].h;
 const run=(separated=false)=>{
  const a=new Float32Array(w*h*4),cx=Math.floor(w/2),cy=Math.floor(h/2);
  if(!separated)for(let i=0;i<w*h;i++)a[i*4+1]=.45;
  const root=(cy*w+cx)*4;a[root]=.6;a[root+1]=.45;a[root+2]=.3;a[root+3]=.1;
  if(separated)a[root+4*(w+1)+1]=.45;
  g.bindTexture(g.TEXTURE_2D,p.field[0].tex);g.texSubImage2D(g.TEXTURE_2D,0,0,0,w,h,g.RGBA,g.FLOAT,a);p.wetUntil=Infinity;
  for(let i=0;i<40;i++)p.step(1/30,i*1000/30,[],[]);
  g.bindFramebuffer(g.FRAMEBUFFER,p.field[0].fbo);const result=new Float32Array(w*h*4);g.readPixels(0,0,w,h,g.RGBA,g.FLOAT,result);
  let holes=0,total=0,roughness=0;
  for(let y=cy-4;y<=cy+4;y++)for(let x=cx-4;x<=cx+4;x++){
   const i=(y*w+x)*4,v=result[i],mean=(result[i-4]+result[i+4]+result[i-w*4]+result[i+w*4])/4;
   holes+=v<1e-6?1:0;total++;roughness+=Math.abs(v-mean);
  }
  return {holes,total,roughness,diagonal:result[root+4*(w+1)],error:g.getError()};
 };
 const result=run(),barrier=run(true);window.__p=e;return {...result,diagonalLeak:barrier.diagonal};
 }''')
 print(json.dumps({'grid':grid}),flush=True)
 assert grid['holes']==0 and grid['roughness']<.02 and grid['error']==0,grid
 assert grid['diagonalLeak']==0,grid
 colours=page.evaluate('''async()=>{
 const e=window.__p,p=e.paint,g=p.gl;const {BIRD_BRUSHES}=await import('/src/birds/catalog.ts');e.beginSignature(934);e.pause();
 e.wetBrush({x:.22,y:.35},.85);e.wetBrush({x:.78,y:.35},.85);e.holdWater();
 const frames=Array.from({length:90},(_,i)=>({time:i/30,rms:.1,energy:.8,bass:.2,mid:.5,treble:.3,brightness:.6,flux:i%9===0?.9:.1,width:0,balance:0,active:true})),analysis={frames,duration:3,onsets:[]};
 e.startSoundStain(analysis,BIRD_BRUSHES.find(b=>b.id==='mesange'),{x:.4,y:.35},934,.8);e.pause();for(let i=0;i<45;i++)e.stepOnce();e.stopBird();
 const mesangeShot=e.capturePreview();let mesangeGrey=0;
 for(let i=0;i<mesangeShot.pixels.length;i+=4){const [r,g,b]=mesangeShot.pixels.slice(i,i+3);if(Math.abs(r-g)<13&&Math.abs(g-b)<13&&r<220)mesangeGrey++;}
 e.startSoundStain(analysis,BIRD_BRUSHES.find(b=>b.id==='bouvreuil'),{x:.65,y:.65},935,.8);e.pause();for(let i=0;i<30;i++)e.stepOnce();e.stopBird();p.render(0);
 const shot=e.capturePreview();let blue=0,yellow=0,grey=0,rose=0;for(let i=0;i<shot.pixels.length;i+=4){const [r,g,b]=shot.pixels.slice(i,i+3);if(b>r*1.15&&b>g*1.05)blue++;if(r>b*1.25&&g>b*1.2)yellow++;if(Math.abs(r-g)<13&&Math.abs(g-b)<13&&r<220)grey++;if(r>g*1.25&&b>g*1.05)rose++;}
 return {blue,yellow,grey,rose,mesangeGrey,error:g.getError()};
 }''')
 print(json.dumps({'colours':colours}),flush=True)
 assert all(colours[c]>30 for c in ['blue','yellow','grey','rose','mesangeGrey']),colours
 assert colours['error']==0 and not errors,(colours,errors)
 page.screenshot(path='/tmp/smooth-plumage-wet.png')
 dry=page.evaluate('''()=>{const e=window.__p;e.setDrying(true);for(let i=0;i<300;i++)e.stepOnce();e.paint.render(0);
 const shot=e.capturePreview();let mesangeGrey=0;
 for(let i=0;i<Math.floor(shot.height*.52)*shot.width*4;i+=4){const r=shot.pixels[i],g=shot.pixels[i+1],b=shot.pixels[i+2];if(Math.abs(r-g)<13&&Math.abs(g-b)<13&&r<220)mesangeGrey++;}
 return {mesangeGrey,error:e.paint.gl.getError()};}''')
 print(json.dumps({'dry':dry}),flush=True)
 # A smoother, lighter water footprint changes the painted area of this scene.
 # Retain a visible proportion of the actual wet grey, rather than 31 fixed pixels.
 assert dry['mesangeGrey']>max(12,colours['mesangeGrey']*.15) and dry['error']==0,(dry,colours)
 page.screenshot(path='/tmp/smooth-plumage-dry.png')
 print('PASS: connected smooth diffusion, visible bird colours, wet and dry render, no browser errors',flush=True)
 b.close()
