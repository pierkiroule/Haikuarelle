"""Optional encounter regression; requires npm run dev and Python Playwright."""
from playwright.sync_api import sync_playwright
import os,json
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.getenv('HAIKUARELLE_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for width,height,reduced in [(1200,900,False),(390,844,True)]:
  page=b.new_page(viewport={'width':width,'height':height},reduced_motion='reduce' if reduced else 'no-preference',is_mobile=width<500,has_touch=width<500);page.set_default_timeout(45000);errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.add_init_script('''for(const C of [WebGLRenderingContext,WebGL2RenderingContext]){const get=C.prototype.getParameter;C.prototype.getParameter=function(p){return p===this.MAX_TEXTURE_SIZE?Math.min(128,get.call(this,p)):get.call(this,p)}}''')
  page.goto(os.getenv('HAIKUARELLE_URL','http://127.0.0.1:5173/'),wait_until='domcontentloaded')
  assert page.locator('.feather-choice').count()==8 and page.locator('.trio-start').count()==0
  if reduced:
   assert page.locator('.feather-path').first.evaluate('e=>getComputedStyle(e).animationName')=='none'
  else:
   first=page.locator('.feather-path').first.evaluate('e=>getComputedStyle(e).transform');page.wait_for_timeout(400)
   assert first!=page.locator('.feather-path').first.evaluate('e=>getComputedStyle(e).transform')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.screenshot(path=f'/tmp/feather-gusts-{width}.png')
  feather=page.locator('.feather-choice[data-bird=pie]');feather.focus();page.keyboard.press('Enter')
  page.locator('.poem-invitation').wait_for()
  assert page.locator('.poem-invitation .poem-lines>span').count()==3
  assert 'Pie' in page.locator('.poem-invitation .bird-eyebrow').inner_text()
  assert page.locator('.feather-circle').count()==0
  page.get_by_role('button',name='Entrer dans l’atelier').click();assert 'Pie' in page.locator('.bird-pad').get_attribute('aria-label')
  assert not errors,errors
  print(json.dumps({'viewport':[width,height],'reducedMotion':reduced,'immediatePoem':True,'errors':errors}),flush=True);page.close()
 b.close()
