from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--no-proxy-server']);page=b.new_page(viewport={'width':1280,'height':900});errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://localhost:5173');page.wait_for_selector('.welcome-emblem');assert page.locator('.artist-signature').inner_text()=='Une création de Pierre-Henri Garnier · •°';assert page.locator('a[href*="github.com"]').count()==0
 print(page.evaluate('''async()=>{const {BIRD_COLOURS}=await import('/src/birds/colourPalettes.ts');for(const button of document.querySelectorAll('.feather-choice')){const actual=[...button.querySelectorAll('stop')].map(s=>s.getAttribute('stop-color'));const expected=BIRD_COLOURS[button.dataset.bird].map(c=>c.hex);if(JSON.stringify(actual)!==JSON.stringify(expected))throw Error('Palette mismatch '+button.dataset.bird)}return {allTwelvePalettes:true}}'''))
 for w,h in [(1280,900),(390,844),(320,568)]:
  page.set_viewport_size({'width':w,'height':h});page.locator('.welcome-intention-link').click();dialog=page.get_by_role('dialog');assert dialog.is_visible();assert dialog.locator('.welcome-process li').count()==3
  assert page.evaluate('document.activeElement.closest("dialog")!==null')
  assert dialog.evaluate('(el)=>el.scrollWidth<=el.clientWidth')
  page.wait_for_timeout(700);page.screenshot(path=f'/tmp/intention-{w}.png');page.keyboard.press('Escape');assert not dialog.is_visible();assert page.locator('.welcome-intention-link').evaluate('(el)=>el===document.activeElement')
  page.screenshot(path=f'/tmp/welcome-{w}.png');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  print({'width':w,'modalAndEscape':True,'focusRestored':True,'noOverflow':True})
 page.emulate_media(reduced_motion='reduce');page.locator('.welcome-intention-link').click();assert dialog.evaluate('(el)=>getComputedStyle(el).animationName')=='none';page.get_by_label('Fermer l’intention artistique').click();assert not dialog.is_visible();page.locator('.feather-choice').first.click(force=True);page.wait_for_selector('.flow-paint');print({'selection':True,'reducedMotion':True,'errors':errors});b.close()
