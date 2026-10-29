from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--no-proxy-server']);page=b.new_page()
 page.route('**/__qa_blank',lambda r:r.fulfill(status=200,content_type='text/html',body='<!doctype html>'));page.goto('http://localhost:5173/__qa_blank')
 print(page.evaluate('''async()=>{
 const {exportResonantArtwork}=await import('/src/birds/export.ts');
 const {paintingOnSheet}=await import('/src/birds/artworkLayout.ts');
 const {fixedPoetryLayout}=await import('/src/birds/FixedPoetry.tsx');
 for(const ratio of [1400/1980,9/16,16/9]){
 const c=document.createElement('canvas');c.width=1000;c.height=Math.round(1000/ratio);const ctx=c.getContext('2d');ctx.fillStyle='#d52b31';ctx.fillRect(0,0,c.width,c.height);
 const src=await new Promise(r=>c.toBlob(r));const title='La lumière de la mésange bleue';const verses=['Le jaune chante au bord du jour','Dans le feuillage un souffle court','Le bleu se pose et devient velours'];
 const png=await createImageBitmap(await exportResonantArtwork(src,verses,title));ctx.clearRect(0,0,c.width,c.height);ctx.drawImage(png,0,0);
 const layout=fixedPoetryLayout((t,s)=>{ctx.font=`${s*1000}px Caveat`;return ctx.measureText(t).width/1000},title,verses,ratio);
 if(layout.titleY+layout.titleSize*1.5*ratio>=.14||layout.verseY<.78||layout.verseY+layout.verseSize*4.5*ratio>.941)throw Error('Text bands overlap');
 const data=ctx.getImageData(0,0,c.width,c.height).data;
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4;if(data[i]>200&&data[i+1]<60&&data[i+2]<70&&(y<c.height*.14-1||y>c.height*.78+1))throw Error('Painting escaped');}
 for(const [x,y] of [[5,5],[995,5],[5,c.height-5]]){const i=(y*c.width+x)*4;if(data[i]!==255||data[i+1]!==255||data[i+2]!==255)throw Error('Nonwhite margin');}
 png.close();
 }
 return {reservedBands:true,uniformWhiteMargins:true,ratios:3};}'''));b.close()
