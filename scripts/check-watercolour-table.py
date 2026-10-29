from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--no-proxy-server']);page=b.new_page(viewport={'width':320,'height':568},is_mobile=True,has_touch=True,reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('**/__table',lambda r:r.fulfill(status=200,content_type='text/html',body='<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div>'));page.goto('http://localhost:5173/__table')
 page.evaluate('''async()=>{const {default:R}=await import('/node_modules/.vite/deps/react.js');const {default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js');await import('/src/App.tsx');const {CreationPalette}=await import('/src/birds/CreationPalette.tsx');const {BIRD_BRUSHES}=await import('/src/birds/catalog.ts');const bird=BIRD_BRUSHES.find(b=>b.id==='mesange');function Demo(){const [tool,onTool]=R.useState('water'),[colour,onColour]=R.useState(null),[size,onSize]=R.useState(.6);return R.createElement('div',{className:'bird-studio direct-studio flow-paint is-immersive'},R.createElement(CreationPalette,{bird,tool,colour,onTool,onColour,size,onSize,opacity:.8,waterSize:.6,waterAmount:.7,inkSize:.6,inkOpacity:.8,canDry:true,canUndo:true,immersive:true,onDry:()=>window.dried=true,onUndo:()=>window.undone=true,onWaterSize:()=>{},onWaterAmount:()=>{},onOpacity:()=>{},onInkSize:()=>{},onInkOpacity:()=>{}}))}createRoot(document.getElementById('root')).render(R.createElement(Demo));}''')
 page.get_by_label('Choisir l’eau résonante').wait_for()
 for w,h in [(320,568),(390,844),(768,1024),(1280,900)]:
  page.set_viewport_size({'width':w,'height':h});page.wait_for_timeout(100)
  for el in page.locator('.palette-toolbar button,.palette-table-actions button').all():
   box=el.bounding_box();assert box['width']>=43.9 and box['height']>=43.9,(w,box)
  bounds=page.locator('.watercolour-table').bounding_box();assert bounds['x']>=0 and bounds['x']+bounds['width']<=w
  if page.locator('.palette-settings').count()==0:page.get_by_label('Déployer la palette').click()
  for el in page.locator('.feather-colours button').all():assert el.bounding_box()['width']>=44
  assert page.get_by_role('button',name='Tout le plumage',exact=True).evaluate('(el)=>getComputedStyle(el.querySelector("i")).backgroundImage.includes("conic-gradient")')
  page.get_by_role('button',name='Plume Jaune citron',exact=True).click();assert page.get_by_role('button',name='Plume Jaune citron',exact=True).get_attribute('aria-pressed')=='true'
  page.screenshot(path=f'/tmp/watercolour-table-{w}.png');print({'width':w,'touchTargets':True,'paletteInsideViewport':True,'pigmentSelection':True},flush=True)
 page.get_by_label('Annuler le dernier geste').click();page.get_by_label('Laisser sécher l’aquarelle').click();assert page.evaluate('window.undone&&window.dried');print({'callbacks':True,'errors':errors});b.close()
