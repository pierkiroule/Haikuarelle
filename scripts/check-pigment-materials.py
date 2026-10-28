"""GPU material regression + repeatable wet/dry comparisons against the previous renderer."""
from playwright.sync_api import sync_playwright
import subprocess,json
baseline=subprocess.check_output(['git','show','bc37106:src/vendor/pigment-drift/paint/shaders.ts'],text=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--enable-unsafe-swiftshader']);page=browser.new_page(viewport={'width':720,'height':1040});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script('''for(const C of [WebGLRenderingContext,WebGL2RenderingContext]){const get=C.prototype.getParameter;if(C===WebGL2RenderingContext)window.nativeGLParameter=get;C.prototype.getParameter=function(p){return p===this.MAX_TEXTURE_SIZE?Math.min(192,get.call(this,p)):get.call(this,p)}}''')
 page.route('**/__qa_blank',lambda route:route.fulfill(status=200,content_type='text/html',body='<!doctype html>'));page.goto('http://localhost:5173/__qa_blank')
 result=page.evaluate('''async old=>{
 const {HaikuarelleEngine}=await import('/src/engine/WatercolorEngine.ts'),{absorptionTable}=await import('/src/vendor/pigment-drift/paint/optics.ts');
 const c=document.createElement('canvas');c.style='position:absolute;opacity:0;pointer-events:none;width:640px;height:906px';document.body.replaceChildren(c);
 const e=new HaikuarelleEngine(c,{palette:'plumages',format:'a4',granulation:.84,wetness:.57,sharpness:.80,dryingThreshold:.42},undefined,message=>{throw Error(message)},{requireAudio:true});e.beginSignature(173);e.pause();const p=e.paint,g=p.gl,w=p.field[0].w,h=p.field[0].h;
 const write=a=>{g.bindTexture(g.TEXTURE_2D,p.field[0].tex);g.texSubImage2D(g.TEXTURE_2D,0,0,0,w,h,g.RGBA,g.FLOAT,a);};
 const read=()=>{g.bindFramebuffer(g.FRAMEBUFFER,p.field[0].fbo);const result=new Float32Array(w*h*4);g.readPixels(0,0,w,h,g.RGBA,g.FLOAT,result);return result;};
 const run=hex=>{
 const absorption=absorptionTable([hex],'#f7f4ec').slice(0,3),sum=absorption.reduce((a,b)=>a+b,0),data=new Float32Array(w*h*4);
 const cx=w*.5,cy=h*.5;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4,v=.4*Math.exp(-((x-cx)**2+(y-cy)**2)/18);data[i]=v;data[i+1]=.45;data[i+2]=v*absorption[1]/sum;data[i+3]=v*absorption[2]/sum;}
 write(data);p.stopFlow();p.wetUntil=Infinity;const before=read();for(let i=0;i<32;i++)p.step(1/30,i*1000/30,[],[]);const after=read();let initial=0,mass=0,spread=0,waterChange=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;initial+=before[i];mass+=after[i];spread+=after[i]*((x-cx)**2+(y-cy)**2);waterChange=Math.max(waterChange,Math.abs(before[i+1]-after[i+1]));}
 return {massRatio:mass/initial,spread:spread/mass,waterChange};};
 const material={blue:run('#2461B6'),yellow:run('#F2CF38'),black:run('#25282A')};
 const colors=['#2461B6','#F2CF38','#77A94D','#25282A'],basis=absorptionTable(colors,'#f7f4ec');
 window.fixture=wet=>{const data=new Float32Array(w*h*4);for(let y=0;y<h;y++)for(let x=0;x<w;x++){
 const u=x/w,v=y/h,i=(y*w+x)*4;data[i+1]=wet&&u>.10&&u<.90&&v>.12&&v<.86?.30:0;
 for(let j=0;j<4;j++){const cx=[.36,.62,.48,.54][j],cy=[.37,.43,.65,.28][j],dx=(u-cx)/[.19,.18,.22,.045][j],dy=(v-cy)/[.18,.17,.14,.08][j];const radius=Math.hypot(dx,dy)+.10*Math.sin(u*39+Math.sin(v*17)*2)+.06*Math.cos(v*47-u*13);
 const load=Math.max(0,1-radius),amount=load*load*1.5*(.93+.07*Math.sin(u*57+v*36));const a=basis.slice(j*3,j*3+3);data[i]+=amount*(a[0]+a[1]+a[2]);data[i+2]+=amount*a[1];data[i+3]+=amount*a[2];}}
 write(data);p.stopFlow();p.wetUntil=Infinity;};
 const oldShader=await import('data:text/javascript;base64,'+btoa(old));window.oldProgram=p.program(oldShader.RENDER);window.newProgram=p.progs.render;window.engine=e;
 window.shot=async(which,wet)=>{window.fixture(wet);p.progs.render=which==='before'?window.oldProgram:window.newProgram;const parameter=g.getParameter;g.getParameter=window.nativeGLParameter;const shot=p.capture(960/Math.max(p.viewW,p.viewH),0);g.getParameter=parameter;const canvas=document.createElement('canvas');canvas.width=shot.width;canvas.height=shot.height;canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(shot.pixels),shot.width,shot.height),0,0);canvas.id='material-shot';const previous=document.getElementById('material-shot');if(previous)previous.replaceWith(canvas);else document.body.append(canvas);return g.getError();};
 return material;
 }''',baseline)
 for name,data in result.items():assert abs(data['massRatio']-1)<.04 and data['waterChange']==0,(name,data)
 assert result['yellow']['spread']>result['blue']['spread']>result['black']['spread'],result
 print(json.dumps(result),flush=True)
 for wet in [True,False]:
  for which in ['before','after']:
   assert page.evaluate('([which,wet])=>window.shot(which,wet)',[which,wet])==0
   page.screenshot(path=f'/tmp/material-{which}-'+('wet' if wet else 'dry')+'.png',full_page=True)
 assert not errors,errors
 page.evaluate('()=>{engine.paint.gl.deleteProgram(oldProgram.p);engine.paint.progs.render=newProgram;engine.destroy()}');browser.close()
 print('PASS: material mobility, retained pigment mass and water, comparison images, no JS/GL errors',flush=True)
