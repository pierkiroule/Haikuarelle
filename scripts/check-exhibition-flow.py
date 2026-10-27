"""Actual exhibition UI, real MP3, capture, relay and inactivity on desktop/mobile."""
from playwright.sync_api import sync_playwright
import json,os,struct
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for width,height in [(1200,1000),(390,844)]:
  page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce',accept_downloads=True);page.set_default_timeout(90000)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.add_init_script('''const clock=performance.now.bind(performance);performance.now=()=>clock()+(window.__ageShift??0);for(const C of [WebGLRenderingContext,WebGL2RenderingContext]){const get=C.prototype.getParameter;C.prototype.getParameter=function(p){return p===this.MAX_TEXTURE_SIZE?Math.min(128,get.call(this,p)):get.call(this,p)}}''')
  page.goto(os.getenv('HAIKUARELLE_URL','http://127.0.0.1:5173/'),wait_until='domcontentloaded')
  page.locator('.feather-choice').first.wait_for();print('ready',width,flush=True);assert page.locator('.artwork-paper').is_visible()
  paper=page.locator('.artwork-paper');box=paper.bounding_box();assert abs(box['width']/box['height']-210/297)<.002
  page.locator('canvas').evaluate('e=>e.dataset.witness="same-canvas"')
  page.locator('.feather-choice[data-bird=mesange]').click()
  page.get_by_role('button',name='Rejoindre l’œuvre').wait_for();assert paper.is_visible()
  title=page.locator('.exhibition-invitation h1').inner_text();assert title==page.locator('.exhibition-title-slot h2').inner_text()
  page.get_by_role('button',name='Rejoindre l’œuvre').click();print('entered',width,flush=True);surface=page.locator('.bird-paper');surface.focus()
  page.keyboard.press('Space');page.get_by_role('button',name='Choisir la plume',exact=False).click();surface.focus();page.keyboard.press('Space')
  print('gestures',width,flush=True);page.wait_for_function('!document.querySelector(".capture-instant").disabled')
  with page.expect_download() as info:page.get_by_role('button',name='Cueillir un instant').click()
  download=info.value;path=download.path();data=open(path,'rb').read();png_w,png_h=struct.unpack('>II',data[16:24]);assert abs(png_w/png_h-210/297)<.001,(png_w,png_h)
  page.screenshot(path=f'/tmp/exhibition-{width}.png',full_page=True)
  page.get_by_role('button',name='Passer la plume',exact=False).click()
  page.locator('.feather-choice').first.wait_for();assert paper.is_visible();assert page.locator('canvas[data-witness=same-canvas]').count()==1
  assert not page.locator('.capture-instant').is_disabled()
  page.locator('.feather-choice[data-bird=pie]').click();page.get_by_role('button',name='Rejoindre l’œuvre').click()
  assert page.locator('canvas[data-witness=same-canvas]').count()==1
  page.evaluate('window.__ageShift=46000');page.get_by_role('dialog').wait_for();page.get_by_role('button',name='Je poursuis').click();assert not page.get_by_role('dialog').count()
  page.evaluate('window.__ageShift=92000');page.get_by_role('dialog').wait_for();page.evaluate('window.__ageShift=106000');page.locator('.feather-choice').first.wait_for()
  assert page.locator('canvas[data-witness=same-canvas]').count()==1
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert not errors,errors
  print(json.dumps({'viewport':[width,height],'capture':[png_w,png_h],'sameCanvasAcrossVisitors':True,'idleWarningAndRelay':True,'noOverflow':True,'errors':errors}),flush=True)
  page.close()
 browser.close()
