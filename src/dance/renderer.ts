import {paintingBounds} from './framing';
import {APP_NAME,publicSiteAddress} from '../brand';
import {loadPoetryFont,POETRY_FONT} from '../birds/FixedPoetry';
import type {BirdSound} from '../birds/BirdAudioBank';
import type {ArtworkPoetry} from '../birds/artworkPoetry';
import {DANCE_TOOLS,gestureFor,soundAt,clamp,type DanceGesture} from './score';
const vertex=`#version 300 es
precision highp float;
in vec2 aUV;
uniform sampler2D uImage;
uniform vec3 uPaper;
uniform float uRatio,uTime,uEnergy,uBass,uTreble,uFlux;
uniform vec3 uGesture[5];
out vec2 vUV;out vec3 vPosition;
void main(){
 vUV=aUV;
 vec3 ink=texture(uImage,aUV).rgb;
 float density=clamp(length(max(vec3(0.),uPaper-ink))*1.3,0.,1.);
 vec2 p=(aUV-.5)*vec2(uRatio,1.)*min(1.,.9/uRatio);
 float z=density*.07;
 float t=uTime;
 z+=density*(.012+.025*uBass+.022*uEnergy)*sin(p.y*9.+t*2.1);
 for(int i=0;i<5;i++){
  vec2 center=(uGesture[i].xy-.5)/vec2(.8,.45);
  vec2 d=p-center;float r=length(d),a=uGesture[i].z*(.35+.65*uEnergy);
  float local=exp(-r*r*7.);
  if(i==0)z+=a*.11*sin(r*24.-t*7.)*exp(-r*2.);
  if(i==1){z+=a*.28*local;p-=d*a*.12*local;}
  if(i==2){float theta=a*.9*local*sin(t*2.+r*5.);p=center+mat2(cos(theta),sin(theta),-sin(theta),cos(theta))*d;z+=a*.08*sin(r*12.-t*3.);}
  if(i==3)z+=a*(.008+.025*uTreble+.025*uFlux)*sin(p.x*95.+t*22.)*sin(p.y*77.-t*16.);
  if(i==4){z+=a*.22*sin(p.x*3.2+t*2.)*(.4+.6*density);p.y+=a*.08*local;}
 }
 float angle=.15*sin(t*.45)+.08+uGesture[4].z*.35-uGesture[2].z*.25;
 vec3 pos=vec3(p.x*cos(angle)+z*sin(angle),p.y,z*cos(angle)-p.x*sin(angle));
 pos=vec3(pos.x,pos.y*.96-pos.z*.20,pos.z*.96+pos.y*.20);
 vPosition=pos;
 float perspective=1./(1.-pos.z*.55);
 gl_Position=vec4(pos.x*1.6*perspective,-pos.y*.90*perspective,0.,1.);
}`;
const fragment=`#version 300 es
precision highp float;
uniform sampler2D uImage;uniform vec3 uPaper;
in vec2 vUV;in vec3 vPosition;out vec4 outColor;
void main(){
 vec3 ink=texture(uImage,vUV).rgb;
 float difference=length(max(vec3(0.),uPaper-ink));
 // Soft matting preserves washes; never use a hard white-key threshold.
 float alpha=smoothstep(.018,.12,difference);
 if(alpha<.002)discard;
 vec3 color=clamp((ink-uPaper*(1.-alpha))/max(alpha,.001),0.,1.);
 vec3 normal=normalize(cross(dFdx(vPosition),dFdy(vPosition)));
 float light=.94+.06*abs(dot(normal,normalize(vec3(-.3,.5,1.))));
 outColor=vec4(color*light,alpha);
}`;
export interface DanceCredit{author:string;license:string;source:string}
export class DanceRenderer{
 private gl:WebGL2RenderingContext;private program:WebGLProgram;private texture:WebGLTexture;private vao:WebGLVertexArrayObject;private buffer:WebGLBuffer;private count=0;
 private surface=document.createElement('canvas');private ctx:CanvasRenderingContext2D;private ratio:number;private paper:number[];
 private site=publicSiteAddress(location.href);
 private uniforms=new Map<string,WebGLUniformLocation|null>();private logo:HTMLImageElement;
 private constructor(readonly canvas:HTMLCanvasElement,image:ImageBitmap,readonly poetry:ArtworkPoetry,readonly sound:BirdSound,paper:string,logo:HTMLImageElement,readonly credit:DanceCredit){
  this.logo=logo;this.ratio=image.width/image.height;this.paper=[1,3,5].map(i=>parseInt(paper.slice(i,i+2),16)/255);
  const gl=this.surface.getContext('webgl2',{alpha:false,antialias:true,preserveDrawingBuffer:false});
  const ctx=canvas.getContext('2d',{alpha:false});if(!gl||!ctx)throw new Error('La danse nécessite WebGL2. Ton image reste disponible.');this.gl=gl;this.ctx=ctx;
  const shaders:WebGLShader[]=[];
  const compile=(type:number,source:string)=>{const shader=gl.createShader(type)!;shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error('La danse ne peut pas ouvrir sa surface 3D.');return shader;};
  this.program=gl.createProgram()!;gl.attachShader(this.program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(this.program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(this.program);shaders.forEach(s=>gl.deleteShader(s));if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error('La surface de danse est indisponible.');
  this.texture=gl.createTexture()!;gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
  const points:number[]=[],nx=80,ny=112;
  for(let y=0;y<ny;y++)for(let x=0;x<nx;x++){const a=x/nx,b=y/ny,c=(x+1)/nx,d=(y+1)/ny;points.push(a,b,c,b,a,d,c,b,c,d,a,d);}
  this.count=points.length/2;this.vao=gl.createVertexArray()!;gl.bindVertexArray(this.vao);this.buffer=gl.createBuffer()!;gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(points),gl.STATIC_DRAW);const attr=gl.getAttribLocation(this.program,'aUV');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
 }
 static async create(canvas:HTMLCanvasElement,painting:Blob,poetry:ArtworkPoetry,sound:BirdSound,paper:string,credit:DanceCredit){
  await loadPoetryFont();const original=await createImageBitmap(painting),probe=document.createElement('canvas');
  probe.width=Math.max(1,Math.round(original.width* Math.min(1,256/Math.max(original.width,original.height))));probe.height=Math.max(1,Math.round(original.height*probe.width/original.width));
  const ctx=probe.getContext('2d');if(!ctx){original.close();throw new Error('La préparation de l’image est indisponible.');}ctx.drawImage(original,0,0,probe.width,probe.height);
  const rgb=[1,3,5].map(i=>parseInt(paper.slice(i,i+2),16)/255),bounds=paintingBounds(ctx.getImageData(0,0,probe.width,probe.height).data,probe.width,probe.height,rgb);
  let image:ImageBitmap|undefined;
  try{image=await createImageBitmap(original,Math.floor(bounds.x*original.width),Math.floor(bounds.y*original.height),Math.max(1,Math.floor(bounds.width*original.width)),Math.max(1,Math.floor(bounds.height*original.height)));
   const logo=new Image();logo.src='/brand/plume-aquarelle.webp';await logo.decode().catch(()=>{});
   return new DanceRenderer(canvas,image,poetry,sound,paper,logo,credit);
  }finally{image?.close();original.close();probe.width=probe.height=1;}
 }
 private uniform(name:string){if(!this.uniforms.has(name))this.uniforms.set(name,this.gl.getUniformLocation(this.program,name));return this.uniforms.get(name)!;}
 draw(time:number,score:readonly DanceGesture[]){
  const {canvas,gl,ctx}=this,w=canvas.width,h=canvas.height;
  if(gl.isContextLost())throw new Error('La surface 3D a été interrompue. Ferme puis rouvre la danse.');
  if(time<9.65){
  if(this.surface.width!==w||this.surface.height!==h){this.surface.width=w;this.surface.height=h;}
  gl.viewport(0,0,w,h);gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(this.program);gl.bindVertexArray(this.vao);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.uniform1i(this.uniform('uImage'),0);gl.uniform3fv(this.uniform('uPaper'),this.paper);gl.uniform1f(this.uniform('uRatio'),this.ratio);gl.uniform1f(this.uniform('uTime'),Math.min(time,9));
  const sound=soundAt(this.sound.analysis,time);for(const [key,value]of Object.entries(sound))gl.uniform1f(this.uniform('u'+key[0].toUpperCase()+key.slice(1)),value);
  const gestures=DANCE_TOOLS.flatMap(tool=>gestureFor(score,tool.id,time));gl.uniform3fv(this.uniform('uGesture[0]'),gestures);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.drawArrays(gl.TRIANGLES,0,this.count);
  ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(this.surface,0,0);
  }else{ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);}
  const text=(value:string,y:number,size:number,color='#35483e',alpha=.8)=>{ctx.save();ctx.fillStyle=color;ctx.globalAlpha=alpha;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${size*w}px ${POETRY_FONT}`;const width=ctx.measureText(value).width;if(width>w*.84)ctx.font=`${size*w*w*.84/width}px ${POETRY_FONT}`;ctx.fillText(value,w/2,h*y);ctx.restore();};
  if(time<9){text(this.poetry.title,.105,.052);const verse=Math.min(2,Math.floor(time/3)),phase=time%3;text(this.poetry.verses[verse],.84,.054,'#35483e',.8*Math.min(1,phase/.22,(3-phase)/.22));text('•°',.925,.036,'#a3443d');}
  else{const fade=clamp((time-9)/.65);ctx.fillStyle=`rgba(255,255,255,${fade})`;ctx.fillRect(0,0,w,h);ctx.save();ctx.globalAlpha=fade;if(this.logo.complete&&this.logo.naturalWidth)ctx.drawImage(this.logo,w*.39,h*.23,w*.22,w*.22);ctx.restore();text(APP_NAME,.46,.072,'#536c60',fade);text('Peindre avec le chant des oiseaux.',.53,.042,'#536c60',fade);if(time>=12){const a=clamp((time-12)/.5);text('À ton tour de faire résonner le vivant.',.64,.039,'#536c60',a);text(this.site,.70,.031,'#536c60',a);}text('•°',.79,.046,'#a3443d',fade);text('Chant : '+this.credit.author,.87,.026,'#6f7b74',fade);text(this.credit.license,.90,.023,'#6f7b74',fade);text(this.credit.source.replace(/^https?:\/\//,''),.93,.021,'#6f7b74',fade);}
 }
 dispose(){const gl=this.gl;gl.deleteTexture(this.texture);gl.deleteBuffer(this.buffer);gl.deleteVertexArray(this.vao);gl.deleteProgram(this.program);gl.getExtension('WEBGL_lose_context')?.loseContext();this.surface.width=this.surface.height=1;}
}
