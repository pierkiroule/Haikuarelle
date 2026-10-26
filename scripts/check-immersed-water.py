"""Real water-audio gesture regression; npm run dev + Python Playwright/Chromium."""
from playwright.sync_api import sync_playwright
import os,json
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.getenv('HAIKUARELLE_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for width,height in [(1200,900),(390,844)]:
  page=b.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');page.set_default_timeout(60000);errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.add_init_script('''window.__songs=[];window.__filters=[];for(const C of [WebGLRenderingContext,WebGL2RenderingContext]){const get=C.prototype.getParameter;C.prototype.getParameter=function(p){return p===this.MAX_TEXTURE_SIZE?Math.min(128,get.call(this,p)):get.call(this,p)}}const create=AudioContext.prototype.createBiquadFilter;AudioContext.prototype.createBiquadFilter=function(){const f=create.call(this);window.__filters.push(f);return f};const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(n,...a){if(this instanceof AudioBufferSourceNode)this.__next=n;if(this instanceof BiquadFilterNode)this.__next=n;return connect.call(this,n,...a)};const start=AudioBufferSourceNode.prototype.start;AudioBufferSourceNode.prototype.start=function(...a){this.__stops=[];window.__songs.push(this);return start.apply(this,a)};const stop=AudioBufferSourceNode.prototype.stop;AudioBufferSourceNode.prototype.stop=function(t){this.__stops?.push(t??this.context.currentTime);return stop.call(this,t??0)};''')
  page.goto(os.getenv('HAIKUARELLE_URL','http://127.0.0.1:5173/'),wait_until='domcontentloaded');page.locator('.feather-choice[data-bird=geai]').click();page.get_by_role('button',name='Entrer dans l’atelier').click();page.wait_for_timeout(150)
  baseline=page.evaluate('window.__songs.length');paper=page.locator('.bird-paper');paper.focus();page.keyboard.down('Space')
  page.wait_for_function('(n)=>window.__songs.length>n',arg=baseline);page.wait_for_timeout(180)
  wet=page.evaluate('''()=>{const s=window.__songs.at(-1),f=s.__next;window.__waterSource=s;return {count:window.__songs.length,filtered:f instanceof BiquadFilterNode,cutoff:f.frequency.value,gain:f.__next.gain.value,loop:s.loop}}''')
  assert wet['filtered'] and not wet['loop'] and 350<wet['cutoff']<1800 and 0<wet['gain']<=.49,wet
  page.keyboard.up('Space');page.wait_for_timeout(150)
  fade=page.evaluate('''()=>{const s=window.__waterSource,f=s.__next;return {gain:f.__next.gain.value,cutoff:f.frequency.value,stops:s.__stops,count:window.__songs.length}}''')
  assert fade['gain']<wet['gain'] and fade['cutoff']<wet['cutoff'],(wet,fade)
  assert len(fade['stops'])==1 and fade['count']==wet['count'],fade
  assert page.locator('.bird-sheet-meta').inner_text().endswith('00 GESTES')
  page.locator('.bird-pad').click();paper.focus();page.keyboard.down('Space');page.keyboard.up('Space')
  page.wait_for_function('(n)=>window.__songs.length>n',arg=wet['count'])
  natural=page.evaluate('''()=>{const s=window.__songs.at(-1);return {filtered:s.__next instanceof BiquadFilterNode,loop:s.loop,stops:s.__stops}}''')
  assert not natural['filtered'] and not natural['loop'] and not natural['stops'],natural
  page.wait_for_timeout(100);assert not errors,errors
  print(json.dumps({'viewport':[width,height],'water':wet,'fade':fade,'natural':natural,'errors':errors}),flush=True);page.close()
 b.close()
