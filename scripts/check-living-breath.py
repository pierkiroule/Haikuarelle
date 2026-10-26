"""Real GPU breath regression: compare a quiet wash, plain airflow and filament-forming airflow; npm run dev; Python Playwright and Chromium required."""
from playwright.sync_api import sync_playwright
import os,json
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.getenv('HAIKUARELLE_CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=b.new_page();page.set_default_timeout(60000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.add_init_script('''for(const C of [WebGLRenderingContext,WebGL2RenderingContext]){const get=C.prototype.getParameter;C.prototype.getParameter=function(p){return p===this.MAX_TEXTURE_SIZE?Math.min(256,get.call(this,p)):get.call(this,p)}}''')
 page.goto(os.getenv('HAIKUARELLE_URL','http://127.0.0.1:5173/'))
 result=page.evaluate('''async()=>{
  const {HaikuarelleEngine}=await import('/src/engine/WatercolorEngine.ts');
  const {LivingBreath}=await import('/src/birds/LivingBreath.ts');const {WetPaper}=await import('/src/birds/WetPaper.ts');
  const canvas=document.createElement('canvas');canvas.style='width:400px;height:700px';document.body.replaceChildren(canvas);
  const e=new HaikuarelleEngine(canvas,{palette:'plumages',format:'portrait'},undefined,undefined,{requireAudio:true});e.beginSignature(1);e.pause();
  const p=e.paint,g=p.gl,w=p.field[0].w,h=p.field[0].h,unit=p.meta.unit*p.k;
  const read=()=>{g.bindFramebuffer(g.FRAMEBUFFER,p.field[0].fbo);const a=new Float32Array(w*h*4);g.readPixels(0,0,w,h,g.RGBA,g.FLOAT,a);return a;};
  const initial=new Float32Array(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const i=(y*w+x)*4,wet=Math.hypot(x-w*.5,y-h*.5)<unit*.18;
   const pigment=Math.exp(-((x-w*.61)**2+(y-h*.5)**2)/(unit*.065)**2)*.55;
   initial[i]=x>w*.90&&x<w*.94?.24:wet?pigment:0;initial[i+1]=wet?.45:0;initial[i+2]=initial[i]*.4;initial[i+3]=initial[i]*.2;
  }
  const run=(active,filaments=false,dryOnly=false)=>{
   p.stopFlow();p.wetUntil=Infinity;g.bindTexture(g.TEXTURE_2D,p.field[0].tex);g.texSubImage2D(g.TEXTURE_2D,0,0,0,w,h,g.RGBA,g.FLOAT,dryOnly?initial.map((v,i)=>i%4===1?0:v):initial);
   const start=read(),water=new WetPaper('portrait',Infinity);water.add({x:.5,y:.5},{x:.5,y:.5},.18,.45,0);const response=new LivingBreath();
   for(let i=0;i<18;i++){
    const time=i/30;
    const point={x:.64+(i%10)*.002,y:.5};if(i%10===0)response.reset();const c=active?response.move(point,i*1000/30,.6,dryOnly?.45:water.at(point,time)):null;const currents=c?[c]:[];
    const segs=currents.map(c=>({ax:c.point.x*w,ay:(1-c.point.y)*h,bx:c.point.x*w,by:(1-c.point.y)*h,radius:c.radius*unit,target:0,strength:0,waterAmount:0,kind:1,slot:0,fx:c.vx*unit,fy:-c.vy*unit,coupling:c.coupling,breath:filaments}));
    p.step(1/30,i*1000/30,segs,[]);
   }
   const a=read();let mass=0,cx=0,cy=0,dryDelta=0,wetDelta=0,waterBefore=0,waterAfter=0,outside=0,wholePigmentDelta=0,bestOutside=null,farthest=0;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4;wetDelta=Math.max(wetDelta,Math.abs(a[i+1]-start[i+1]));
    waterBefore+=start[i+1];waterAfter+=a[i+1];wholePigmentDelta=Math.max(wholePigmentDelta,Math.abs(a[i]-start[i]));
    if(start[i+1]<.001&&a[i+1]>.015&&a[i]>.02){outside++;farthest=Math.max(farthest,x/w-.68);if(!bestOutside||a[i+1]>bestOutside.amount)bestOutside={point:{x:(x+.5)/w,y:1-(y+.5)/h},amount:a[i+1]};}
    if(x>w*.90)dryDelta=Math.max(dryDelta,Math.abs(a[i]-start[i]));
    if(x<w*.86){mass+=a[i];cx+=a[i]*x;cy+=a[i]*y;}
   }
   if(active){
    const before=read();p.step(1/30,2100,[],[{x:w*.5,y:h*.5,r0:0,r1:unit*.035,ink:0,kind:1,slot:0}]);const after=read();
    for(let i=1;i<after.length;i+=4)wetDelta=Math.max(wetDelta,Math.abs(after[i]-before[i]));
   }
   let tip=0;const edge=[];
   for(let y=Math.floor(h*.45);y<Math.ceil(h*.55);y++){
    let far=0;for(let x=0;x<w*.86;x++)if(a[(y*w+x)*4]>.12)far=x;
    edge.push(far);tip=Math.max(tip,far);
   }
   let branches=0,span=0;
   for(let x=Math.floor(w*.52);x<Math.floor(w*.74);x++){
    let count=0,inside=false,first=-1,last=-1;
    for(let y=Math.floor(h*.35);y<Math.ceil(h*.65);y++){
     const present=a[(y*w+x)*4]>.10;
     if(present&&!inside)count++;inside=present;
     if(present){if(first<0)first=y;last=y;}
    }
    branches=Math.max(branches,count);span=Math.max(span,last-first);
   }
   let guideWater=0;
   if(filaments&&!dryOnly&&bestOutside){
    const snapshot=p.captureMoisture();if(snapshot){e.wetPaper.replaceMoisture(snapshot,0);guideWater=e.waterAt(bestOutside.point);}
   }
   return {centroid:[cx/mass,cy/mass],dryDelta,wetDelta,tip,edge,mass,branches,span,waterBefore,waterAfter,outside,wholePigmentDelta,guideWater,farthest};
  };
  const quiet=run(false),blowing=run(true),filaments=run(true,true),dryOnly=run(true,true,true),distance=Math.hypot(blowing.centroid[0]-quiet.centroid[0],blowing.centroid[1]-quiet.centroid[1]);
  const error=g.getError();e.destroy();return {quiet,blowing,filaments,dryOnly,displacement:distance,error};
 }''')
 assert result['displacement']>.15,result
 assert result['blowing']['dryDelta']<1e-5 and result['blowing']['wetDelta']<1e-5,result
 assert result['filaments']['outside']>8,result
 assert result['filaments']['farthest']>.09,result
 assert result['blowing']['outside']==0,result
 assert result['filaments']['wetDelta']>.01,result
 assert result['filaments']['guideWater']>.01,result
 assert result['filaments']['branches']>=3,result
 assert abs(result['filaments']['waterAfter']/result['filaments']['waterBefore']-1)<.05,result
 assert result['filaments']['dryDelta']<1e-5,result
 assert result['dryOnly']['waterAfter']==0 and result['dryOnly']['wholePigmentDelta']<1e-5,result
 assert result['error']==0 and not errors,(result,errors)
 print(json.dumps(result),flush=True);b.close()
