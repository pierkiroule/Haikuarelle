"""Optional Chromium regression: npm run dev, then run with Python Playwright.
Uses a small GPU field to exercise the real engine without hardware acceleration.
"""
from playwright.sync_api import sync_playwright
import json,os
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.getenv('HAIKUARELLE_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for width,height in [(1200,1000),(390,844)]:
  page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce',is_mobile=width<500,has_touch=width<500);page.set_default_timeout(60000)
  errors=[];modules=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:modules.append(r.url) if '/src/engine/WatercolorEngine.ts' in r.url else None)
  page.add_init_script('''crypto.getRandomValues=a=>{a.fill(2);return a};for(const C of [WebGLRenderingContext,WebGL2RenderingContext]){const get=C.prototype.getParameter;C.prototype.getParameter=function(p){return p===this.MAX_TEXTURE_SIZE?Math.min(128,get.call(this,p)):get.call(this,p)}}''')
  page.goto(os.getenv('HAIKUARELLE_URL','http://127.0.0.1:5173/'),wait_until='domcontentloaded')

  page.evaluate('''async url=>{const {HaikuarelleEngine}=await import(url),begin=HaikuarelleEngine.prototype.beginSignature;HaikuarelleEngine.prototype.beginSignature=function(...args){window.__p=this;return begin.apply(this,args)}}''',modules[-1])
  page.locator('.feather-choice[data-bird=geai]').click()
  page.wait_for_function('!!document.querySelector(".flow-paint")')
  assert page.locator('.artwork-title').count()==0 and page.locator('.resonant-haiku').count()==0
  assert page.locator('.paper-signature').inner_text()=='•°○'
  paper=page.locator('.bird-paper')
  box=paper.bounding_box();x=box['x']+box['width']*.5;y=box['y']+box['height']*.5
  page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+box['width']*.08,y,steps=3);page.mouse.up()
  assert page.evaluate('window.__p.waterAt({x:.5,y:.5})')>0
  page.locator('.bird-pad').click()
  page.mouse.move(x-box['width']*.12,y);page.mouse.down();page.mouse.move(x+box['width']*.15,y+box['height']*.05,steps=6);page.mouse.up()
  page.wait_for_function('window.__p.status.hasPigment')
  page.get_by_role('button',name='Choisir l’eau résonante',exact=True).click()
  assert page.get_by_role('slider',name='Quantité d’eau',exact=True).is_visible()
  slider=page.get_by_role('slider',name='Quantité d’eau',exact=True);slider.fill('70')
  page.mouse.move(x,y);page.mouse.down();page.mouse.move(x-box['width']*.05,y,steps=3);page.mouse.up()
  assert page.locator('.flow-paint').count()==1
  assert page.evaluate('window.__p.waterAt({x:.5,y:.5})')>0
  assert page.locator('.resonant-haiku').count()==0
  page.screenshot(path=f'/tmp/creation-palette-{width}.png')
  page.get_by_role('button',name='Déployer la palette',exact=True).click()
  expanded=paper.bounding_box()['height'];page.evaluate('window.__creationCanvas=document.querySelector(".bird-paper canvas")')
  page.get_by_role('button',name='Réduire la palette',exact=True).click();page.wait_for_timeout(300)
  assert abs(paper.bounding_box()['height']-expanded)<1
  assert page.evaluate('window.__creationCanvas===document.querySelector(".bird-paper canvas")')
  page.screenshot(path=f'/tmp/creation-palette-collapsed-{width}.png')
  page.get_by_role('button',name='Déployer la palette',exact=True).click()
  page.get_by_role('button',name='Laisser sécher',exact=True).click()
  page.evaluate('async()=>{await window.__p.finish()}');page.locator('.flow-finished').wait_for()
  assert page.locator('.resonant-haiku').count()==0
  page.get_by_role('button',name='Révéler le haïku résonant',exact=False).click()
  assert page.locator('.resonant-haiku>span').count()==3
  assert not errors,errors
  print(json.dumps({'viewport':[width,height],'haikuRevealedAfterPainting':True,'waterAfterPigment':True,'errors':errors}),flush=True)
  page.close()
 browser.close()
