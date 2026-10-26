"""Optional encounter UI regression; requires npm run dev and Python Playwright."""
from playwright.sync_api import sync_playwright
import os,json
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.getenv('HAIKUARELLE_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for width,height,reduced in [(1200,900,False),(390,844,True)]:
  page=b.new_page(viewport={'width':width,'height':height},reduced_motion='reduce' if reduced else 'no-preference',is_mobile=width<500,has_touch=width<500);page.set_default_timeout(45000);errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.add_init_script('''for(const C of [WebGLRenderingContext,WebGL2RenderingContext]){const get=C.prototype.getParameter;C.prototype.getParameter=function(p){return p===this.MAX_TEXTURE_SIZE?Math.min(128,get.call(this,p)):get.call(this,p)}}''')
  page.goto(os.getenv('HAIKUARELLE_URL','http://127.0.0.1:5173/'),wait_until='domcontentloaded')
  assert page.locator('.feather-choice').count()==8
  assert page.locator('.wheel-spin').count()==0
  if reduced:
   assert page.locator('.feather-path').first.evaluate('e=>getComputedStyle(e).animationName')=='none'
  else:
   first=page.locator('.feather-path').first.evaluate('e=>getComputedStyle(e).transform');page.wait_for_timeout(300)
   assert first!=page.locator('.feather-path').first.evaluate('e=>getComputedStyle(e).transform')
   circle=page.locator('.feather-circle');circle.scroll_into_view_if_needed();rect=circle.bounding_box();page.mouse.move(rect['x']+rect['width']/2,rect['y']+rect['height']/2)
   assert page.locator('.feather-path').first.evaluate('e=>getComputedStyle(e).animationPlayState')=='paused'
  page.get_by_role('button',name='Choisir la plume Mésange bleue',exact=True).click()
  assert page.locator('.encounter-result strong').inner_text()=='Mésange bleue'
  assert page.get_by_role('button',name='Choisir la plume Mésange bleue',exact=True).get_attribute('aria-pressed')=='true'
  page.get_by_role('button',name='Choisir la plume Pie',exact=True).focus();page.keyboard.press('Enter')
  assert page.locator('.encounter-result strong').inner_text()=='Pie'
  assert page.locator('.feather-choice[aria-pressed=true]').count()==1
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  page.screenshot(path=f'/tmp/feather-encounter-{width}.png')
  page.get_by_role('button',name='Découvrir mon haïku').click();page.get_by_role('button',name='Entrer dans l’atelier').click()
  assert 'Pie' in page.locator('.bird-pad').get_attribute('aria-label')
  assert not errors,errors
  print(json.dumps({'viewport':[width,height],'reducedMotion':reduced,'directChoice':'pie','errors':errors}),flush=True);page.close()
 b.close()
