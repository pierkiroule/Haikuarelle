from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--no-proxy-server']);page=browser.new_page();page.goto('http://localhost:5173/vocaux/index.html')
 print(page.evaluate('''async()=>{
 const {scheduleSoundtrack,echoPhrases}=await import('/src/dance/soundtrack.ts');const context=new OfflineAudioContext(2,48000*30,48000),response=await fetch('/birds/mesange.mp3'),buffer=await context.decodeAudioData(await response.arrayBuffer());
 const phrases=echoPhrases(buffer.duration);scheduleSoundtrack(context,buffer,context.destination);const rendered=await context.startRendering(),pcm=rendered.getChannelData(0);
 if(phrases.length!==4||phrases[0].duration!==buffer.duration)throw Error('Wrong phrase count');
 const rms=(a,b)=>{let sum=0;for(let i=Math.floor(a*48000);i<Math.floor(b*48000);i++)sum+=pcm[i]*pcm[i];return Math.sqrt(sum/((b-a)*48000));};
 const levels=phrases.map(p=>rms(p.start,p.start+p.duration));if(levels.some(level=>level<=0))throw Error('Missing sample or echo');
 const tail=rms(27,30);if(tail!==0)throw Error('Missing final silence');return {phrases,levels,finalSilence:tail};
 }'''),flush=True);browser.close()
