"""Real interaction regression: a quick breath released before RAF must still move the wet material.
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
  verses=page.locator('.poem-invitation .poem-lines>span').all_text_contents();assert len(verses)==3
  assert page.locator('.artwork-title').count()==1
  page.get_by_role('button',name='Entrer dans l’atelier').click();page.wait_for_function('!!document.querySelector(".flow-paint")')
  assert page.get_by_role('button',name='Choisir l’eau résonante',exact=True).get_attribute('aria-pressed')=='true'
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  paper=page.locator('.bird-paper');box=paper.bounding_box();
  title=page.locator('.artwork-paper>.artwork-title').bounding_box();footer=page.locator('.paper-footer').bounding_box()
  assert title['y']+title['height']<=box['y']+1
  assert box['y']+box['height']<=footer['y']+1
  page.locator('.artwork-title h2').click();assert not page.evaluate('!!window.__p.status.hasPigment')
  assert page.locator('.paper-signature').inner_text()=='•°○'
  assert page.locator('.paper-footer .poem-lines').evaluate('e=>parseFloat(getComputedStyle(e).fontSize)')>=9
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
  assert page.locator('.paper-footer .poem-lines>span').all_text_contents()==verses
  page.get_by_role('button',name='Choisir le souffle du vivant',exact=True).click()
  assert page.get_by_role('slider',name='Taille du souffle',exact=True).is_visible()
  assert page.get_by_role('slider',name='Opacité',exact=False).count()==0
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  before=page.locator('.bird-sheet-meta').inner_text()
  page.evaluate('()=>{window.__blows=0;const original=window.__p.blow.bind(window.__p);window.__p.blow=(...args)=>{window.__blows++;return original(...args)}}')
  page.evaluate('()=>{window.__captures=0;const original=window.__p.paint.captureMoisture.bind(window.__p.paint);window.__p.paint.captureMoisture=(...args)=>{window.__captures++;return original(...args)}}')
  page.evaluate('()=>{window.__forces=0;const step=window.__p.paint.step.bind(window.__p.paint);window.__p.paint.step=(...args)=>{window.__forces+=args[2].filter(s=>s.breath).length;return step(...args)};window.__p.pause();window.__originalRAF=requestAnimationFrame;window.requestAnimationFrame=()=>99999999}')
  paper.focus();page.keyboard.down('Space');page.keyboard.press('ArrowRight');page.keyboard.up('Space')
  assert page.evaluate('window.__forces')==0
  page.evaluate('()=>{window.requestAnimationFrame=window.__originalRAF;window.__p.pause();window.__p.resume()}')
  page.wait_for_function('window.__forces>=18')
  assert page.evaluate('window.__forces')==18
  assert page.evaluate('window.__captures')>=1
  assert page.evaluate('window.__p.paint.gl.getError()')==0
  assert page.evaluate('window.__blows')>=2
  assert page.locator('.bird-sheet-meta').inner_text()==before
  assert page.locator('.breath-cursor').is_visible()
  page.screenshot(path=f'/tmp/living-breath-{width}.png')
  assert not errors,errors
  print(json.dumps({'viewport':[width,height],'quickReleaseBeforeRAF':True,'burstTicks':18,'noNewMarks':True,'errors':errors}),flush=True)
  page.close()
 browser.close()
