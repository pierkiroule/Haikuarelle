"""Optional browser regression: start npm run dev, then run this script.
Requires Python Playwright and Chromium. Tests the production 3D component
with a controlled pigment fixture, real samples, HRTF and resource cleanup.
"""
from playwright.sync_api import sync_playwright
import json,os
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.getenv('HAIKUARELLE_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for width,height,reduced in [(1280,900,False),(390,844,True)]:
  page=b.new_page(viewport={'width':width,'height':height},reduced_motion='reduce' if reduced else 'no-preference');page.set_default_timeout(45000)
  errors=[];urls=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:urls.append(r.url) if '/.vite/deps/three.js' in r.url else None)
  page.add_init_script('''window.__THREE_DEVTOOLS__=new EventTarget();window.__THREE_DEVTOOLS__.addEventListener('observe',e=>{const obj=e.detail;if(obj.isScene)window.__scene=obj;if(obj.isWebGLRenderer){window.__renderer=obj;const render=obj.render.bind(obj);obj.render=(scene,camera)=>{window.__camera=camera;window.__scene=scene;window.__renders=(window.__renders||0)+1;return render(scene,camera)}}});window.__voices=[];window.__panners=[];const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(node,...args){if(this instanceof AudioBufferSourceNode&&node instanceof GainNode)this.__gain=node;if(this instanceof GainNode&&node instanceof PannerNode)this.__panner=node;return connect.call(this,node,...args)};const start=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...args){const item={duration:this.buffer.duration,loop:this.loop,spatial:!!this.__gain?.__panner,ended:false};window.__voices.push(item);this.addEventListener('ended',()=>item.ended=true);return start.apply(this,args)};const pan=AudioContext.prototype.createPanner;AudioContext.prototype.createPanner=function(){const p=pan.call(this);window.__panners.push(p);return p;}''')
  page.goto(os.getenv('HAIKUARELLE_URL','http://127.0.0.1:5173')+'/tests/fixtures/voyage.html');page.wait_for_function('!!window.__mountVoyage')
  page.evaluate('''async()=>{
   const width=240,height=320,pixels=new Uint8Array(width*height*4);
   for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const ring=Math.hypot((x-116)*1.05,y-133),branch=Math.abs(x-(88+25*Math.sin(y*.028)))<9&&y>110&&y<260;
    const lateral=Math.hypot(x-180,y-240)<20;
    const paint=(ring<65&&ring>34)||branch||lateral;
    const color=x<92?[50,118,166]:y<155?[218,186,67]:[192,85,120];pixels.set([...(paint?color:[247,244,236]),255],(y*width+x)*4);
   }
   const frame={width,height,pixels},marks=[{bird:'geai',point:{x:.25,y:.4},seed:1},{bird:'mesange',point:{x:.68,y:.38},seed:2},{bird:'pie',point:{x:.75,y:.75},seed:3}];
   document.querySelector('#open').onclick=()=>{
    const context=new AudioContext();context.resume();window.__context=context;
    const journey={frame,paper:'#f7f4ec',marks,title:'La mémoire des chênes',seed:943,context,loadAudio:async()=>{
     const buffers=new Map(),failed=[];await Promise.all(['geai','mesange','pie'].map(async id=>{try{buffers.set(id,await context.decodeAudioData(await (await fetch('/birds/'+id+'.mp3')).arrayBuffer()))}catch{failed.push(id)}}));return {buffers,failed};
    }};
    window.__mountVoyage(journey,()=>{window.__closeVoyage();context.close();});
   };
  }''')
  page.locator('#open').click()
  try:page.get_by_role('navigation',name='Commandes du voyage').wait_for()
  except Exception:
   print(json.dumps({'body':page.locator('body').inner_text(),'errors':errors}),flush=True);raise
  assert page.locator('dialog').evaluate('e=>e.open')
  assert page.locator('dialog canvas').count()==1
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')

  if reduced:
   assert page.get_by_role('button',name='Reprendre le vol automatique').count()==1
   page.wait_for_timeout(1000);assert page.evaluate('window.__voices.length')==0
   page.get_by_role('button',name='Reprendre le vol automatique').click()
  page.wait_for_function('window.__voices.length>0',timeout=25000)
  page.wait_for_function('!!window.__scene')
  info=page.evaluate('''()=>{const mesh=window.__scene.children.find(c=>c.isMesh),p=mesh.geometry.attributes.position;return {voices:window.__voices,panners:window.__panners.map(p=>({mode:p.panningModel,x:p.positionX.value,y:p.positionY.value,z:p.positionZ.value})),vertices:p.count,triangles:mesh.geometry.index.count/3,zmin:Math.min(...Array.from(p.array).filter((_,i)=>i%3===2)),zmax:Math.max(...Array.from(p.array).filter((_,i)=>i%3===2)),camera:window.__camera.position.toArray()}}''')
  assert info['vertices']>1000 and info['zmin']<-.05 and info['zmax']>.05,info
  assert all(v['spatial'] and not v['loop'] for v in info['voices']),info
  assert all(p['mode']=='HRTF' for p in info['panners']),info
  page.screenshot(path=f'/tmp/voyage-front-{width}.png')
  page.get_by_role('button',name='Suspendre le vol').click()
  page.wait_for_timeout(200);before=page.evaluate('window.__voices.length');pose=page.evaluate('window.__camera.position.toArray()')
  canvas=page.locator('dialog canvas');box=canvas.bounding_box();page.mouse.move(box['x']+box['width']*.5,box['y']+box['height']*.5);page.mouse.down();page.mouse.move(box['x']+box['width']*.85,box['y']+box['height']*.55,steps=15);page.mouse.up();page.wait_for_timeout(500)
  assert page.evaluate('window.__voices.length')==before
  assert page.evaluate('window.__camera.position.toArray()')!=pose
  page.screenshot(path=f'/tmp/voyage-orbit-{width}.png')
  page.get_by_role('button',name='Retour à mon haïkuarelle').click();page.wait_for_function('window.__context.state==="closed"')
  assert page.locator('dialog').count()==0 and page.locator('#open').is_visible()
  page.wait_for_timeout(150);assert page.evaluate('window.__renderer.getContext().isContextLost()')
  assert not errors,errors
  print(json.dumps({'viewport':[width,height],'reducedMotion':reduced,'mesh':info,'errors':errors}),flush=True)
  page.close()
 b.close()
