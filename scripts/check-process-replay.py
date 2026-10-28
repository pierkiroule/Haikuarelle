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
 await renderer.draw(6);const early=checksum();await renderer.draw(24);const late=checksum();if(early===late)throw Error('No forward evolution');
 await renderer.draw(0);const start=checksum();await renderer.draw(30);const final=checksum();if(start===final)throw Error('No real evolution');
 let maxCache=0;for(let t=0;t<=30;t++){await renderer.draw(t);maxCache=Math.max(maxCache,renderer.cache.size);}if(maxCache>4)throw Error('Unbounded decoded cache');await renderer.draw(30);
 const {exportResonantArtwork}=await import('/src/birds/export.ts');const png=await createImageBitmap(await exportResonantArtwork(painting,['Une eau en silence','La couleur dans la lumière','Le chant se dépose'],'Le souffle du rouge-gorge'));
 const expected=document.createElement('canvas');expected.width=720;expected.height=1280;const ec=expected.getContext('2d');ec.imageSmoothingQuality='high';const height=Math.min(1280*.74,720*.9/(720/1018)),width=height*720/1018,x=(720-width)/2,y=1280*.47-height/2;ec.drawImage(png,x,y,width,height);
 const a=ec.getImageData(Math.ceil(x),Math.ceil(y),Math.floor(width)-2,Math.floor(height)-2).data,b=canvas.getContext('2d').getImageData(Math.ceil(x),Math.ceil(y),Math.floor(width)-2,Math.floor(height)-2).data;
 let difference=0;for(let i=0;i<a.length;i++)difference=Math.max(difference,Math.abs(a[i]-b[i]));if(difference>1)throw Error('Final frame differs from PNG: '+difference);png.close();window.renderer=renderer;
 return {forwardOnly:early!==late,finalMatchesPNG:true,realEvolution:start!==final,maxDecodedImages:maxCache};}'''),flush=True)
 page.screenshot(path='/tmp/process-replay-final.png');page.evaluate('window.renderer.dispose()');print({'errors':errors},flush=True);b.close()
