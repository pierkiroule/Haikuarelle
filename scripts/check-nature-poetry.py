from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--no-proxy-server']);page=b.new_page();page.route('**/__nature',lambda r:r.fulfill(status=200,content_type='text/html',body='<!doctype html>'));page.goto('http://localhost:5173/__nature')
 print(page.evaluate('''async()=>{
 const {readArtwork,makeResonantHaiku,morphicFamily}=await import('/src/birds/artworkPoetry.ts');const {exportResonantArtwork}=await import('/src/birds/export.ts');const {NATURE_PIGMENTS}=await import('/src/birds/naturePoetry.ts');const results=[];
 for(const [bird,color,style] of [['mesange','#2461B6','islands'],['rougegorge','#CE653B','branches'],['pie','#25282A','compact']]){
 const c=document.createElement('canvas');c.width=400;c.height=566;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,400,566);ctx.fillStyle=color;
 if(style==='islands'){for(const [x,y] of [[90,130],[260,210],[150,380],[310,440]]){ctx.beginPath();ctx.arc(x,y,24,0,Math.PI*2);ctx.fill();}}
 else if(style==='branches'){ctx.fillRect(197,100,6,360);for(let y=130;y<440;y+=35)ctx.fillRect(100,y,200,4);}
 else ctx.fillRect(90,170,220,210);
 const data=ctx.getImageData(0,0,400,566),reading=readArtwork({width:400,height:566,pixels:new Uint8Array(data.data)},'#ffffff');const poem=makeResonantHaiku([{bird,seed:7,point:{x:.5,y:.5}}],17,reading,bird);
 if(!NATURE_PIGMENTS[reading.tones[0]].some(p=>poem.verses[1].includes(p)))throw Error('Colour not reflected');
 const blob=await new Promise(r=>c.toBlob(r));const png=await exportResonantArtwork(blob,poem.verses,poem.title);if(!png.size)throw Error('No PNG');
 results.push({bird,tones:reading.tones,shape:morphicFamily(reading),title:poem.title,verses:poem.verses,export:true});
 }return results;}'''));b.close()
