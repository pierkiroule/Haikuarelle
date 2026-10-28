from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--no-proxy-server']);page=b.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:5173/vocaux/index.html')
 print(page.evaluate('''async()=>{
 const {DanceRenderer}=await import('/src/dance/renderer.ts');const source=document.createElement('canvas');source.width=720;source.height=1018;const c=source.getContext('2d'),frames=[];
 for(let i=0;i<9;i++){c.fillStyle='#f7f4ec';c.fillRect(0,0,720,1018);for(let j=0;j<i;j++){c.fillStyle=['#35788c','#c5b140','#a95a46'][j%3];c.beginPath();c.arc(140+(j%3)*180,220+Math.floor(j/3)*220,65,0,Math.PI*2);c.fill();}frames.push({time:i*250,image:await new Promise(r=>source.toBlob(r,'image/jpeg',.9))});}
 const painting=await new Promise(r=>source.toBlob(r));const canvas=document.createElement('canvas');canvas.width=720;canvas.height=1280;document.body.append(canvas);
 const renderer=await DanceRenderer.create(canvas,painting,{title:'Le souffle du rouge-gorge',verses:['Une eau en silence','La couleur dans la lumière','Le chant se dépose']},{},'#f7f4ec',{author:'Test',license:'CC0',source:'https://example.org'},frames);
 const checksum=()=>{let hash=2166136261;for(const value of canvas.getContext('2d').getImageData(0,0,720,1280).data)hash=Math.imul(hash^value,16777619);return hash>>>0;};
 await renderer.draw(6);const forward=checksum();await renderer.draw(24);const reverse=checksum();if(forward!==reverse)throw Error('Reverse mismatch');
 await renderer.draw(0);const start=checksum();await renderer.draw(15);const final=checksum();if(start===final)throw Error('No real evolution');
 let maxCache=0;for(let t=0;t<=30;t++){await renderer.draw(t);maxCache=Math.max(maxCache,renderer.cache.size);}if(maxCache>4)throw Error('Unbounded decoded cache');await renderer.draw(15);window.renderer=renderer;
 return {forwardReverseIdentical:forward===reverse,realEvolution:start!==final,maxDecodedImages:maxCache};}'''),flush=True)
 page.screenshot(path='/tmp/process-replay-final.png');page.evaluate('window.renderer.dispose()');print({'errors':errors},flush=True);b.close()
