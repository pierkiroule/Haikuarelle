"""Actual bird recording → full paper → dry → reveal → drag/resize → signed PNG."""
from playwright.sync_api import sync_playwright
from PIL import Image
import os,json
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path=os.getenv('HAIKUARELLE_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 for bird,name,width,height in [('rossignol','rossignol philomèle',1200,1000),('etourneau','étourneau sansonnet',320,568)]:
  page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='reduce',accept_downloads=True);page.set_default_timeout(120000);errors=[];modules=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:modules.append(r.url) if '/src/engine/WatercolorEngine.ts' in r.url else None)
  page.add_init_script('''for(const C of [WebGLRenderingContext,WebGL2RenderingContext]){const get=C.prototype.getParameter;C.prototype.getParameter=function(p){return p===this.MAX_TEXTURE_SIZE?Math.min(192,get.call(this,p)):get.call(this,p)}}''')
  print('opening',width,flush=True)
  page.goto(os.getenv('HAIKUARELLE_URL','http://127.0.0.1:5173/'),wait_until='domcontentloaded')
  page.locator('.feather-choice').first.wait_for();assert page.locator('.feather-choice').count()==12;print('loaded',width,flush=True)
  # Limit the software display buffer as well as the field, so a short real
  # sample cannot finish while SwiftShader renders a full-window frame.
  page.evaluate('''async url=>{const {HaikuarelleEngine}=await import(url);const begin=HaikuarelleEngine.prototype.beginSignature;HaikuarelleEngine.prototype.beginSignature=function(...args){
    window.__p=this;const view=this.paint.setView.bind(this.paint);this.paint.setView=(w,h,cw,ch)=>{const k=Math.min(1,180/Math.max(cw,ch));return view(w,h,Math.max(1,Math.round(cw*k)),Math.max(1,Math.round(ch*k)))};
    return begin.apply(this,args);
  }}''',modules[-1])
  print('instrumented',width,flush=True)
  page.locator(f'.feather-choice[data-bird={bird}]').click();page.locator('.is-immersive').wait_for()
  assert page.locator('.artwork-title,.paper-footer,.poem-invitation,.resonant-haiku').count()==0
  paper=page.locator('.bird-paper');box=paper.bounding_box();assert abs(box['width']/box['height']-210/297)<.002
  page.locator('canvas').evaluate('e=>e.dataset.witness="same-paper"')
  print('painting',width,flush=True)
  paper.focus();page.keyboard.press('Space');page.locator('.bird-pad').click();paper.focus();page.keyboard.press('Space')
  page.wait_for_function('!!window.__p?.status.hasPigment');print('pigment ready',width,flush=True)
  page.wait_for_timeout(400);page.keyboard.press('Escape')
  page.get_by_role('button',name='Laisser sécher',exact=False).wait_for(state='visible');page.wait_for_function('!document.querySelector(".finalize-art").disabled')
  page.get_by_role('button',name='Laisser sécher',exact=False).click();page.evaluate('()=>window.__p.pause()')
  bar=page.locator('.drying-progress');bar.wait_for();assert page.locator('.artwork-paper.is-drying').count()==1
  assert page.locator('.drying-feathers').count()==0
  assert page.locator('.drying-sun').evaluate('e=>getComputedStyle(e).animationName')=='none'
  page.emulate_media(reduced_motion='no-preference')
  assert page.locator('.drying-sun').evaluate('e=>getComputedStyle(e).animationName')=='drying-sun-turn'
  assert page.locator('.artwork-paper').evaluate("e=>getComputedStyle(e,'::after').animationName")=='drying-blue-halo'
  page.emulate_media(reduced_motion='reduce')
  page.evaluate('async()=>{await window.__p.finish()}');page.locator('.flow-finished').wait_for();print('dry',width,flush=True);assert page.locator('.drying-progress,.artwork-paper.is-drying').count()==0
  assert page.locator('.resonant-haiku').count()==0
  page.get_by_role('button',name='Révéler le haïku résonant',exact=False).click();poem=page.locator('.resonant-haiku');poem.wait_for()
  assert poem.locator('span').count()==3 and page.locator('.artwork-title').count()==0
  title=page.locator('.resonant-title');assert name in title.inner_text().lower()
  page.evaluate('()=>document.fonts.ready');assert page.evaluate("()=>document.fonts.check('20px \"Caveat\"')")
  assert title.evaluate('e=>getComputedStyle(e).opacity')=='0.8' and poem.evaluate('e=>getComputedStyle(e).opacity')=='0.8'
  assert 'Caveat' in title.evaluate('e=>getComputedStyle(e).fontFamily')
  assert title.evaluate('e=>getComputedStyle(e).textAlign')=='center' and poem.evaluate('e=>getComputedStyle(e).textAlign')=='center'
  assert page.locator('.composition-tabs,input[type=color],.composition-font').count()==0
  assert page.locator('.composition-editor input').count()==1
  assert page.get_by_role('button',name='Partager l’œuvre',exact=False).is_disabled()
  page.get_by_role('slider',name='Taille de la peinture',exact=True).fill('60')
  handle=page.locator('.painting-handle');handle.scroll_into_view_if_needed();h=handle.bounding_box();handle.focus();page.keyboard.press('ArrowRight')
  assert handle.bounding_box()['x']>h['x']
  paper_box=paper.bounding_box();tb=title.bounding_box();pb=poem.bounding_box()
  assert abs(tb['x']+tb['width']/2-paper_box['x']-paper_box['width']/2)<2
  assert tb['y']<paper_box['y']+paper_box['height']*.1 and pb['y']>paper_box['y']+paper_box['height']*.7
  assert pb['y']+pb['height']<paper_box['y']+paper_box['height']*.94
  assert title.evaluate('e=>getComputedStyle(e).pointerEvents')=='none' and poem.evaluate('e=>getComputedStyle(e).pointerEvents')=='none'
  assert 'scale(0.6)' in page.locator('canvas').get_attribute('style')
  page.screenshot(path=f'/tmp/new-feather-{bird}.png',full_page=True)
  page.get_by_role('button',name='Valider la composition').click();assert not page.get_by_role('button',name='Partager l’œuvre',exact=False).is_disabled()
  assert page.locator('.resonant-haiku.is-editable').count()==0
  with page.expect_download() as info:page.get_by_role('button',name='Télécharger l’image',exact=False).click()
  im=Image.open(info.value.path()).convert('RGB');assert abs(im.width/im.height-210/297)<.005
  red=sum(r>g+25 and r>b+25 for r,g,b in im.crop((int(im.width*.8),int(im.height*.92),im.width,im.height)).getdata());assert red>0
  assert page.locator('canvas[data-witness=same-paper]').count()==1
  page.screenshot(path=f'/tmp/resonant-haiku-{width}.png',full_page=True)
  page.get_by_role('button',name='Déplacer la peinture').click();assert page.get_by_role('button',name='Partager l’œuvre',exact=False).is_disabled()
  assert not errors,errors
  print(json.dumps({'viewport':[width,height],'threeVerses':poem.locator('span').all_text_contents(),'dragAndResize':True,'fixedTitle':title.inner_text(),'handwritten':True,'signatureInPNG':True,'export':[im.width,im.height],'sameCanvas':True,'errors':errors}),flush=True);page.close()
 browser.close()
