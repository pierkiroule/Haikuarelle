from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--enable-unsafe-swiftshader']);page=b.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script('''for(const C of [WebGLRenderingContext,WebGL2RenderingContext]){const get=C.prototype.getParameter;C.prototype.getParameter=function(p){return p===this.MAX_TEXTURE_SIZE?Math.min(256,get.call(this,p)):get.call(this,p)}}''')
 page.route('**/__qa_blank',lambda route:route.fulfill(status=200,content_type='text/html',body='<!doctype html>'));page.goto('http://localhost:5173/__qa_blank')
 print(page.evaluate('''async()=>{
 const {HaikuarelleEngine}=await import('/src/engine/WatercolorEngine.ts');const canvas=document.createElement('canvas');canvas.style.cssText='width:180px;height:254px';document.body.append(canvas);
 const engine=new HaikuarelleEngine(canvas,{palette:'plumages',format:'a4',granulation:.84,wetness:.57,complexity:.52,ink:.2,resonance:.96,sharpness:.8,dryingThreshold:.42},undefined,e=>{throw Error(e)},{requireAudio:true});engine.beginSignature(7);engine.pause();
 const hidden=()=>engine.paint.capture(128/Math.max(engine.paint.viewW,engine.paint.viewH),0,false).pixels;
 const visible=()=>engine.paint.capture(128/Math.max(engine.paint.viewW,engine.paint.viewH),0,true).pixels;
 const blank=hidden();engine.wetBrush({x:.5,y:.5},1,.8,1);engine.pause();for(let i=0;i<8;i++)engine.stepOnce();
 const checksum=()=>Array.from(engine.paint.save().data).reduce((a,v)=>a+v,0);const before=checksum(),film=hidden(),studio=visible(),after=checksum();
 let hiddenDifference=0,visibleDifference=0;for(let i=0;i<film.length;i++){hiddenDifference+=Math.abs(film[i]-blank[i]);visibleDifference+=Math.abs(studio[i]-blank[i]);}
 if(visibleDifference<100)throw Error('Water missing in studio');if(hiddenDifference>visibleDifference*.01)throw Error('Water remains visible in film');if(before!==after)throw Error('Capture changed physics');
 engine.destroy();return {waterVisibleInStudio:visibleDifference,waterVisibleInFilm:hiddenDifference,physicsUnchanged:before===after};}'''),flush=True)
 print({'errors':errors},flush=True);b.close()
