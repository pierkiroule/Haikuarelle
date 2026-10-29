from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--no-proxy-server']);page=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('**/__reader',lambda r:r.fulfill(status=200,content_type='text/html',body='<meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div>'));page.goto('http://localhost:5173/__reader')
 page.evaluate('''async()=>{const {default:React}=await import('/node_modules/.vite/deps/react.js');const {default:{createRoot}}=await import('/node_modules/.vite/deps/react-dom_client.js');const {ArtworkViewer}=await import('/src/birds/ArtworkViewer.tsx');const c=document.createElement('canvas');c.width=1400;c.height=1980;const ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,1400,1980);ctx.fillStyle='#35483e';ctx.font='54px serif';ctx.fillText('Le souffle de la mésange',160,180);ctx.fillText('Le bleu se pose au bord du jour',120,1700);const image=await new Promise(r=>c.toBlob(r));function Demo(){const [open,setOpen]=React.useState(false);return React.createElement(React.Fragment,null,React.createElement('button',{id:'open',onClick:()=>setOpen(true)},'Agrandir'),open&&React.createElement(ArtworkViewer,{image,onClose:()=>setOpen(false)}))}createRoot(document.getElementById('root')).render(React.createElement(Demo));}''')
 page.locator('#open').click();page.wait_for_selector('.artwork-viewer img');page.locator('.artwork-viewer img').evaluate('(el)=>el.decode()');page.wait_for_timeout(150)
 session=page.context.new_cdp_session(page);rect=page.locator('.artwork-viewer-area').bounding_box();cx=rect['x']+rect['width']/2;cy=rect['y']+rect['height']/2
 def touches(kind,dist=None):
  pts=[] if dist is None else [{'x':cx-dist,'y':cy,'id':1},{'x':cx+dist,'y':cy,'id':2}]
  session.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':pts})
 touches('touchStart',35)
 for d in [45,60,80,110]:touches('touchMove',d)
 touches('touchEnd');page.wait_for_timeout(80)
 level=page.get_by_label('Niveau de zoom').inner_text();assert int(level.split()[0])>200,level
 print({'pinchZoom':level})
 before=page.locator('.artwork-viewer img').get_attribute('style')
 session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':cx,'y':cy,'id':1}]})
 session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':cx+45,'y':cy-60,'id':1}]})
 session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
 assert page.locator('.artwork-viewer img').get_attribute('style')!=before

 page.get_by_role('button',name='Vue entière').click();assert page.get_by_label('Niveau de zoom').inner_text()=='100 %'
 page.get_by_label('Agrandir le zoom',exact=True).click();assert page.get_by_label('Niveau de zoom').inner_text()=='150 %'
 page.get_by_role('button',name='Vue entière').click()
 # A double touch also magnifies without moving the source artwork.
 page.touchscreen.tap(cx,cy);page.wait_for_timeout(80);page.touchscreen.tap(cx,cy);assert page.get_by_label('Niveau de zoom').inner_text()=='300 %'
 page.screenshot(path='/tmp/artwork-reader.png');page.keyboard.press('Escape');assert page.locator('dialog').count()==0
 assert page.locator('#open').evaluate('(el)=>el===document.activeElement')
 print({'pan':True,'buttons':True,'doubleTap':True,'escapeAndFocus':True,'errors':errors});b.close()
