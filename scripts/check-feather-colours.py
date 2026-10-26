"""Optional browser check: start npm run dev; requires Python Playwright/Chromium.
Exercises the real GPU shader, colour menu and complete song at a small field size.
"""
from playwright.sync_api import sync_playwright
import json,os
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.getenv('HAIKUARELLE_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for width,height in [(1200,1000),(390,844)]:
  page=b.new_page(viewport={'width':width,'height':height},reduced_motion='reduce',is_mobile=width<500,has_touch=width<500);page.set_default_timeout(60000);errors=[];modules=[]
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:modules.append(r.url) if '/src/engine/WatercolorEngine.ts' in r.url else None)
  page.add_init_script('''crypto.getRandomValues=a=>{a.fill(3);return a};for(const C of [WebGLRenderingContext,WebGL2RenderingContext]){const get=C.prototype.getParameter;C.prototype.getParameter=function(p){return p===this.MAX_TEXTURE_SIZE?Math.min(128,get.call(this,p)):get.call(this,p)}}''')
  page.goto(os.getenv('HAIKUARELLE_URL','http://127.0.0.1:5173/'),wait_until='domcontentloaded');page.get_by_role('button',name='Tourner la roue',exact=True).click();page.wait_for_function('!!document.querySelector(".wheel-result strong")')
  page.evaluate('''async url=>{const {HaikuarelleEngine}=await import(url),begin=HaikuarelleEngine.prototype.beginSignature;HaikuarelleEngine.prototype.beginSignature=function(...args){window.__p=this;return begin.apply(this,args)}}''',modules[-1])
  page.get_by_role('button',name='Découvrir mon haïku').click();page.get_by_role('button',name='Entrer dans l’atelier').click();page.locator('.bird-pad').click()
  assert page.locator('.feather-colours button:not(.whole-plumage)').count()==8
  assert page.get_by_role('button',name='Plume Vert olive',exact=True).is_visible()
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.screenshot(path=f'/tmp/colour-menu-{width}.png')
  page.get_by_role('button',name='Plume Jaune citron',exact=True).click();assert page.locator('.brush-context').count()==0
  assert page.locator('.bird-pad stop').first.get_attribute('stop-color')=='#F2CF38'
  rect=page.locator('.bird-paper').bounding_box();page.mouse.click(rect['x']+rect['width']*.5,rect['y']+rect['height']*.5)
  page.wait_for_function('window.__p.status.hasPigment');page.get_by_role('button',name='Laisser sécher',exact=True).click();page.evaluate('async()=>{await window.__p.finish()}');page.locator('.flow-finished').wait_for()
  image=page.evaluate('''()=>{const f=window.__p.capturePreview();let yellow=0,blue=0;for(let i=0;i<f.pixels.length;i+=4){const [r,g,b]=f.pixels.slice(i,i+3);if(r-b>25&&g-b>20)yellow++;if(b-r>20)blue++}return {yellow,blue}}''')
  assert image['yellow']>0 and image['blue']==0,image
  assert not errors,errors
  print(json.dumps({'viewport':[width,height],'blueTitColours':8,'yellowOnly':image,'errors':errors}),flush=True);page.close()
 b.close()
