"""Real WebGL snapshots retain wet water, pigment and fine ink; UI never fetches voices."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--no-proxy-server','--use-angle=swiftshader','--enable-unsafe-swiftshader']);page=b.new_page(viewport={'width':320,'height':568},reduced_motion='reduce');errors=[];requests=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:requests.append(r.url))
 page.add_init_script('''for(const C of [WebGLRenderingContext,WebGL2RenderingContext]){const get=C.prototype.getParameter;C.prototype.getParameter=function(p){return p===this.MAX_TEXTURE_SIZE?Math.min(192,get.call(this,p)):get.call(this,p)}}''')
 page.route('**/__qa_blank',lambda route:route.fulfill(status=200,content_type='text/html',body='<!doctype html>'));page.goto('http://localhost:5173/__qa_blank')
 print(page.evaluate('''async()=>{
 const {HaikuarelleEngine}=await import('/src/engine/WatercolorEngine.ts');const canvas=document.createElement('canvas');canvas.style.cssText='width:128px;height:181px';document.body.append(canvas);
 const engine=new HaikuarelleEngine(canvas,{palette:'plumages',format:'a4',granulation:.84,wetness:.57,complexity:.52,ink:.2,resonance:.96,sharpness:.8,dryingThreshold:.42},undefined,e=>{throw Error(e)},{requireAudio:true});engine.beginSignature(7);engine.pause();
 const checksum=()=>{let h=2166136261;for(const v of engine.capturePreview().pixels)h=Math.imul(h^v,16777619);return h>>>0;};
 const blank=checksum();engine.checkpointGesture();engine.wetBrush({x:.5,y:.5},1,.8,1);engine.pause();for(let i=0;i<8;i++)engine.stepOnce();
 const water=engine.waterAt({x:.5,y:.5}),wetImage=checksum(),wet=engine.paint.captureMoisture().water;
 engine.checkpointGesture();const {BirdAudioBank}=await import('/src/birds/BirdAudioBank.ts'),{BIRD_BRUSHES}=await import('/src/birds/catalog.ts');const bank=new BirdAudioBank(),sound=await bank.prepare('mesange');let clock=0;
 engine.startSoundStain(sound.analysis,{...BIRD_BRUSHES.find(b=>b.id==='mesange'),inkTool:true},{x:.5,y:.5},23,.8,0,()=>clock);engine.pause();for(let i=0;i<50;i++){clock=i/30;engine.stepOnce();}
 if(!engine.composition.ink.length)throw Error('No ink to undo');const inkCount=engine.composition.ink.length;engine.undoGesture();
 const restored=engine.paint.captureMoisture().water;if(!wet.every((v,i)=>v===restored[i]))throw Error('Wet field was changed by undo');if(checksum()!==wetImage)throw Error('Ink/pigment not restored');if(engine.waterAt({x:.5,y:.5})!==water)throw Error('CPU water guide not restored');if(engine.composition.ink.length)throw Error('Fine ink not removed');
 engine.undoGesture();if(checksum()!==blank||engine.waterAt({x:.5,y:.5})!==0||engine.undoDepth!==0)throw Error('Blank state not restored');
 for(let i=0;i<10;i++)engine.checkpointGesture();if(engine.undoDepth>6)throw Error('Unbounded gesture history');engine.clear();if(engine.undoDepth!==0)throw Error('History survived clear');
 bank.destroy();engine.destroy();return {waterPreserved:true,inkRemoved:inkCount,blankRestored:true,historyBounded:true};}'''),flush=True)
 page.goto('http://localhost:5173');page.locator('.feather-choice').first.click();undo=page.get_by_role('button',name='Annuler le dernier geste',exact=True);undo.wait_for();assert undo.is_disabled()
 assert page.get_by_role('button',name='Voix',exact=False).count()==0
 paper=page.locator('.bird-paper');paper.focus();page.keyboard.press('Space');page.wait_for_timeout(350);assert undo.is_enabled();undo.click();assert undo.is_disabled()
 box=undo.bounding_box();assert box['x']>=0 and box['x']+box['width']<=320
 paper.focus();page.keyboard.press('Space');page.wait_for_timeout(250);assert undo.is_enabled();page.keyboard.press('Control+z');assert undo.is_disabled()
 assert not any('/vocaux/' in url for url in requests);assert not errors,errors
 print({'buttonAndShortcut':True,'noVocalRequests':True,'errors':errors},flush=True);b.close()
