"""Real browser: full A4 paper, floating dock, settings and Escape, without resetting the canvas."""
from playwright.sync_api import sync_playwright
import os,json
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('HAIKUARELLE_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for width,height in [(1200,1000),(390,844),(844,390),(320,568)]:
  page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce');page.set_default_timeout(90000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.add_init_script('''for(const C of [WebGLRenderingContext,WebGL2RenderingContext]){const get=C.prototype.getParameter;C.prototype.getParameter=function(p){return p===this.MAX_TEXTURE_SIZE?Math.min(128,get.call(this,p)):get.call(this,p)}}''')
  page.goto(os.getenv('HAIKUARELLE_URL','http://127.0.0.1:5173/'),wait_until='domcontentloaded')
  page.locator('.feather-choice[data-bird=mesange]').click();page.get_by_role('button',name='Entrer dans l’atelier').click()
  page.locator('.is-immersive').wait_for();assert not page.locator('.bird-header').is_visible();assert not page.locator('.ritual-heading').is_visible()
  assert page.get_by_role('button',name='Laisser sécher',exact=False).is_visible()
  paper=page.locator('.artwork-paper');box=paper.bounding_box();dock=page.locator('.creation-palette').bounding_box();surface=page.locator('.bird-paper')
  assert abs(box['width']/box['height']-210/297)<.002,box
  assert box['width']>=.95*min(width-24,(height-154)*210/297),box
  assert abs(box['x']+box['width']/2-width/2)<2,box
  assert box['x']>=-1 and box['x']+box['width']<=width+1 and box['y']>=0 and box['y']+box['height']<=dock['y']+1,(box,dock)
  assert dock['x']>=0 and dock['x']+dock['width']<=width+1,(width,dock)
  page.locator('canvas').evaluate('e=>e.dataset.witness="same-canvas"')
  page.get_by_role('button',name='Choisir l’eau résonante',exact=True).click()
  page.get_by_role('slider',name='Quantité d’eau',exact=True).wait_for();opened=paper.bounding_box()
  assert all(abs(box[k]-opened[k])<1 for k in ['x','y','width','height']),(box,opened)
  page.get_by_role('slider',name='Quantité d’eau',exact=True).fill('60')
  surface.focus();page.keyboard.press('Space');assert page.locator('.palette-settings').count()==0
  assert page.locator('canvas[data-witness=same-canvas]').count()==1
  page.screenshot(path=f'/tmp/immersive-atelier-{width}x{height}.png',full_page=True)
  page.keyboard.press('Escape');assert page.locator('.is-immersive').count()==0
  assert page.locator('canvas[data-witness=same-canvas]').count()==1
  page.get_by_role('button',name='Toile immersive',exact=True).click();page.locator('.is-immersive').wait_for()
  if width==1200:
   surface.focus();page.keyboard.press('f');page.locator('.bird-viewing').wait_for()
   assert page.locator('.creation-palette').is_visible() and page.locator('.paper-footer .poem-lines').is_visible()
  page.get_by_role('button',name='Quitter le mode immersif',exact=True).click();assert not page.locator('.is-immersive').count()
  assert not errors,errors
  print(json.dumps({'viewport':[width,height],'paper':box,'dock':dock,'stablePaperWithSettings':True,'sameCanvas':True,'escapeAndButton':True,'errors':errors}),flush=True);page.close()
 browser.close()
