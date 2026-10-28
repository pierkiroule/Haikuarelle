"""Verify that replay controls never cover the three-line poem, on compact screens."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--no-proxy-server'])
 for width,height in [(320,568),(390,844),(844,390)]:
  page=browser.new_page(viewport={'width':width,'height':height})
  page.goto('http://localhost:5173/vocaux/index.html')
  result=page.evaluate('''async()=>{
   await import('/src/dance/dance.css');const {DanceRenderer}=await import('/src/dance/renderer.ts');
   document.body.innerHTML='<dialog class="flight-dialog"><header><h2>La naissance de mon haïkuarelle</h2><button>×</button></header><canvas class="flight-canvas" width="720" height="1280"></canvas><div class="flight-controls"><span class="flight-status">La création en avant · puis en arrière</span><button>Suspendre</button><button>Garder le film · 30 s</button></div></dialog>';
   const source=document.createElement('canvas');source.width=720;source.height=1018;const ctx=source.getContext('2d');ctx.fillStyle='#f7f4ec';ctx.fillRect(0,0,720,1018);const painting=await new Promise(r=>source.toBlob(r));
   const canvas=document.querySelector('canvas');const renderer=await DanceRenderer.create(canvas,painting,{title:'Le souffle du rouge-gorge',verses:['Un chant entre les branches','La lumière traverse les feuilles','Et le silence ouvre ses ailes']},{},'#f7f4ec',{author:'Auteur',license:'CC0',source:'https://example.org'},[{time:0,image:painting},{time:1,image:painting}]);await renderer.draw(30);document.querySelector('dialog').showModal();
   const image=canvas.getBoundingClientRect(),controls=document.querySelector('.flight-controls').getBoundingClientRect();
   if(image.bottom>controls.top+.1||controls.bottom>innerHeight+.1||image.height<80)throw Error('Replay controls obscure the image');
   const pixels=canvas.getContext('2d').getImageData(50,Math.round(1280*.72),620,140).data;let ink=0;for(let i=0;i<pixels.length;i+=4)if(pixels[i]<180&&pixels[i+1]<180)ink++;
   if(ink<20)throw Error('Third verse missing from the video pixels');renderer.dispose();return {canvasHeight:image.height,controlsTop:controls.top,thirdVersePixels:ink};
  }''')
  print({'viewport':[width,height],**result},flush=True);page.screenshot(path=f'/tmp/video-haiku-{width}.png');page.close()
 browser.close()
