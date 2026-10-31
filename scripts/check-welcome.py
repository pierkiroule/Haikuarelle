from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--no-proxy-server']);page=b.new_page(viewport={'width':1280,'height':900},has_touch=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://localhost:5173');page.wait_for_selector('.welcome-emblem');page.get_by_role('button',name='Entrer dans Haïkuarelle',exact=False).click()
 assert page.locator('.artist-signature').inner_text()=='Une création de Pierre-Henri Garnier · projet vibecodé avec IA · •°'
 assert page.locator('a[href*="github.com"],.feather-motion,.intention-dialog,.welcome-intention-link').count()==0
 print(page.evaluate('''async()=>{const {BIRD_COLOURS}=await import('/src/birds/colourPalettes.ts');for(const button of document.querySelectorAll('.feather-choice')){const actual=[...button.querySelectorAll('stop')].map(s=>s.getAttribute('stop-color'));const expected=BIRD_COLOURS[button.dataset.bird].map(c=>c.hex);if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('Palette mismatch '+button.dataset.bird)}return {allTwelvePalettes:true}}'''))
 for w,h in [(1280,900),(390,844),(320,568)]:
  page.set_viewport_size({'width':w,'height':h});page.emulate_media(reduced_motion='reduce');track=page.locator('.intention-track');track.scroll_into_view_if_needed()
  page.get_by_label('Lire : La résonance',exact=True).click();page.wait_for_function('document.querySelector(".intention-dots button:first-child").ariaCurrent==="true"')
  assert page.get_by_label('Page précédente',exact=True).is_disabled()
  page.get_by_label('Page suivante',exact=True).click();page.wait_for_function('document.querySelectorAll(".intention-dots button")[1].ariaCurrent==="true"')
  assert page.locator('.welcome-process li').count()==3
  track.focus();page.keyboard.press('End');page.wait_for_function('document.querySelectorAll(".intention-dots button")[2].ariaCurrent==="true"');assert page.get_by_label('Page suivante',exact=True).is_disabled()
  page.keyboard.press('Home');page.wait_for_function('document.querySelector(".intention-dots button").ariaCurrent==="true"')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path=f'/tmp/welcome-carousel-{w}.png');print({'width':w,'buttonsAndKeyboard':True,'noOverflow':True},flush=True)
 # Real native touch scroll at mobile width.
 track.scroll_into_view_if_needed();r=track.bounding_box();session=page.context.new_cdp_session(page);y=max(30,min(500,r['y']+100));x=r['x']+r['width']*.85
 session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':1}]})
 for i in range(1,9):session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x-r['width']*.8*i/8,'y':y,'id':1}]})
 session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});page.wait_for_function('document.querySelector(".intention-track").scrollLeft>100')
 assert page.locator('.emblem-feather').evaluate('(el)=>getComputedStyle(el).animationName')=='none'
 page.locator('.feather-choice').first.focus();page.locator('.feather-choice').first.click(force=True);page.wait_for_selector('.flow-paint');print({'touchSwipe':True,'selection':True,'reducedMotion':True,'errors':errors});b.close()
