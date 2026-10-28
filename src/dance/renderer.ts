import {flightMatrix,flightMesh,pigmentFocus,type Vec3} from './flight';
import {paintingBounds} from './framing';
import {APP_NAME,publicSiteAddress} from '../brand';
import {loadPoetryFont,POETRY_FONT} from '../birds/FixedPoetry';
import type {BirdSound} from '../birds/BirdAudioBank';
import type {ArtworkPoetry} from '../birds/artworkPoetry';
import {soundAt,clamp} from './score';
const vertex=`#version 300 es
precision highp float;
in vec2 aUV;
uniform sampler2D uImage;
uniform vec3 uPaper;
uniform float uRatio,uTime,uEnergy,uBass,uTreble,uFlux;
uniform mat4 uViewProjection;
out vec2 vUV;out vec3 vNormal;
void main(){
 vUV=aUV;
 float lod=max(0.,log2(max(float(textureSize(uImage,0).x)/128.,float(textureSize(uImage,0).y)/176.))+1.);
 vec3 ink=textureLod(uImage,aUV,lod).rgb;
 float density=clamp(length(max(vec3(0.),uPaper-ink))*1.3,0.,1.);
 vec2 p=(aUV-.5)*vec2(uRatio,1.)*min(1.,.9/uRatio);
 float t=uTime*6.28318530718/9.,voice=.35+.65*uEnergy;
 float wing=sin(p.x*5.2+t*2.)*cos(p.y*3.5-t);
 float swell=sin(p.y*7.-t*3.+p.x*3.);
 float amplitude=.13+.08*uBass;
 float z=density*.12+wing*amplitude+swell*.075*voice;
 float dzdx=5.2*cos(p.x*5.2+t*2.)*cos(p.y*3.5-t)*amplitude+3.*cos(p.y*7.-t*3.+p.x*3.)*.075*voice;
 float dzdy=-3.5*sin(p.x*5.2+t*2.)*sin(p.y*3.5-t)*amplitude+7.*cos(p.y*7.-t*3.+p.x*3.)*.075*voice;
 dzdx+=18.*cos(p.x*18.+p.y*11.-t*8.)*.025*uFlux;
 dzdy+=11.*cos(p.x*18.+p.y*11.-t*8.)*.025*uFlux;
 vNormal=normalize(vec3(-dzdx,dzdy,1.));
 z+=sin(p.x*18.+p.y*11.-t*8.)*.025*uFlux;
 z+=sin(p.x*43.-t*17.)*cos(p.y*39.+t*11.)*.009*uTreble;
 float turn=.10*sin(t+p.y*2.);p=mat2(cos(turn),sin(turn),-sin(turn),cos(turn))*p;
 vec3 pos=vec3(p.x,-p.y,z);
 gl_Position=uViewProjection*vec4(pos,1.);
}`;
const fragment=`#version 300 es
precision highp float;
uniform sampler2D uImage;uniform vec3 uPaper;
in vec2 vUV;in vec3 vNormal;out vec4 outColor;
void main(){
 vec3 ink=texture(uImage,vUV).rgb;
 float difference=length(max(vec3(0.),uPaper-ink));
 // Soft matting preserves washes; never use a hard white-key threshold.
 float alpha=smoothstep(.018,.12,difference);
 if(alpha<.002)discard;
 vec3 color=clamp((ink-uPaper*(1.-alpha))/max(alpha,.001),0.,1.);
 vec3 normal=normalize(vNormal);
 float light=.84+.16*abs(dot(normal,normalize(vec3(-.35,.5,1.))));
 outColor=vec4(color*light,alpha);
}`;
export interface DanceCredit{author:string;license:string;source:string}
export class DanceRenderer{
 private gl:WebGL2RenderingContext;private program:WebGLProgram;private texture:WebGLTexture;private vao:WebGLVertexArrayObject;private buffer:WebGLBuffer;private count=0;private indexBuffer:WebGLBuffer;private focus:Vec3[]=[];
 private surface=document.createElement('canvas');private ctx:CanvasRenderingContext2D;private ratio:number;private paper:number[];
 private site=publicSiteAddress(location.href);
 private uniforms=new Map<string,WebGLUniformLocation|null>();private logo:HTMLImageElement;
 private constructor(readonly canvas:HTMLCanvasElement,image:ImageBitmap,readonly poetry:ArtworkPoetry,readonly sound:BirdSound,paper:string,logo:HTMLImageElement,readonly credit:DanceCredit){
  this.logo=logo;this.ratio=image.width/image.height;this.paper=[1,3,5].map(i=>parseInt(paper.slice(i,i+2),16)/255);
  const gl=this.surface.getContext('webgl2',{alpha:false,antialias:true,preserveDrawingBuffer:false});
  const ctx=canvas.getContext('2d',{alpha:false});if(!gl||!ctx)throw new Error('Le vol nécessite WebGL2. Ton image reste disponible.');this.gl=gl;this.ctx=ctx;
  const shaders:WebGLShader[]=[];
  const compile=(type:number,source:string)=>{const shader=gl.createShader(type)!;shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error('Le vol ne peut pas ouvrir sa surface 3D.');return shader;};
  this.program=gl.createProgram()!;gl.attachShader(this.program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(this.program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(this.program);shaders.forEach(s=>gl.deleteShader(s));if(!gl.getProgramParameter(this.program,gl.LINK_STATUS))throw new Error('La surface de danse est indisponible.');
  this.texture=gl.createTexture()!;gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
  /* indexed geometry shares vertices while keeping the original HD colour map */
  const mesh=flightMesh(canvas.width<1000);
  this.count=mesh.indices.length;this.vao=gl.createVertexArray()!;gl.bindVertexArray(this.vao);this.buffer=gl.createBuffer()!;gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,mesh.vertices,gl.STATIC_DRAW);const attr=gl.getAttribLocation(this.program,'aUV');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,2,gl.FLOAT,false,0,0);
  this.indexBuffer=gl.createBuffer()!;gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.indices,gl.STATIC_DRAW);
  gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
  const anisotropy=gl.getExtension('EXT_texture_filter_anisotropic');if(anisotropy)gl.texParameterf(gl.TEXTURE_2D,anisotropy.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));

 }
 static async create(canvas:HTMLCanvasElement,painting:Blob,poetry:ArtworkPoetry,sound:BirdSound,paper:string,credit:DanceCredit){
  await loadPoetryFont();const original=await createImageBitmap(painting),probe=document.createElement('canvas');
  probe.width=Math.max(1,Math.round(original.width* Math.min(1,256/Math.max(original.width,original.height))));probe.height=Math.max(1,Math.round(original.height*probe.width/original.width));
  const ctx=probe.getContext('2d');if(!ctx){original.close();throw new Error('La préparation de l’image est indisponible.');}ctx.drawImage(original,0,0,probe.width,probe.height);
  const rgb=[1,3,5].map(i=>parseInt(paper.slice(i,i+2),16)/255),bounds=paintingBounds(ctx.getImageData(0,0,probe.width,probe.height).data,probe.width,probe.height,rgb);
  let image:ImageBitmap|undefined;
  try{image=await createImageBitmap(original,Math.floor(bounds.x*original.width),Math.floor(bounds.y*original.height),Math.max(1,Math.floor(bounds.width*original.width)),Math.max(1,Math.floor(bounds.height*original.height)));
   const logo=new Image();logo.src='/brand/plume-aquarelle.webp';await logo.decode().catch(()=>{});
   const scene=new DanceRenderer(canvas,image,poetry,sound,paper,logo,credit);
   ctx.clearRect(0,0,probe.width,probe.height);ctx.drawImage(image,0,0,probe.width,probe.height);scene.focus=pigmentFocus(ctx.getImageData(0,0,probe.width,probe.height).data,probe.width,probe.height,rgb,image.width/image.height);
   return scene;
  }finally{image?.close();original.close();probe.width=probe.height=1;}
 }
 private uniform(name:string){if(!this.uniforms.has(name))this.uniforms.set(name,this.gl.getUniformLocation(this.program,name));return this.uniforms.get(name)!;}
 draw(time:number){
  const {canvas,gl,ctx}=this,w=canvas.width,h=canvas.height;
  if(gl.isContextLost())throw new Error('La surface 3D a été interrompue. Ferme puis rouvre la danse.');
  if(time<9.65){
  if(this.surface.width!==w||this.surface.height!==h){this.surface.width=w;this.surface.height=h;}
  gl.viewport(0,0,w,h);gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(this.program);gl.bindVertexArray(this.vao);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.uniform1i(this.uniform('uImage'),0);gl.uniform3fv(this.uniform('uPaper'),this.paper);gl.uniform1f(this.uniform('uRatio'),this.ratio);gl.uniform1f(this.uniform('uTime'),Math.min(time,9));
  const sound=soundAt(this.sound.analysis,time);for(const [key,value]of Object.entries(sound))gl.uniform1f(this.uniform('u'+key[0].toUpperCase()+key.slice(1)),value);
  gl.uniformMatrix4fv(this.uniform('uViewProjection'),false,flightMatrix(Math.min(time,9),w/h,this.focus));gl.enable(gl.DEPTH_TEST);gl.clear(gl.DEPTH_BUFFER_BIT);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.drawElements(gl.TRIANGLES,this.count,gl.UNSIGNED_SHORT,0);
  ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(this.surface,0,0);
  }else{ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);}
  const text=(value:string,y:number,size:number,color='#35483e',alpha=.8)=>{ctx.save();ctx.fillStyle=color;ctx.globalAlpha=alpha;ctx.textAlign='center';ctx.textBaseline='middle';const unit=Math.min(w,h*9/16);ctx.font=`${size*unit}px ${POETRY_FONT}`;const width=ctx.measureText(value).width;if(width>w*.84)ctx.font=`${size*unit*w*.84/width}px ${POETRY_FONT}`;ctx.fillText(value,w/2,h*y);ctx.restore();};
  if(time<9){text(this.poetry.title,.105,.052);const verse=Math.min(2,Math.floor(time/3)),phase=time%3;text(this.poetry.verses[verse],.84,.054,'#35483e',.8*Math.min(1,phase/.22,(3-phase)/.22));text('•°',.925,.036,'#a3443d');}
  else{const fade=clamp((time-9)/.65);ctx.fillStyle=`rgba(255,255,255,${fade})`;ctx.fillRect(0,0,w,h);ctx.save();ctx.globalAlpha=fade;if(this.logo.complete&&this.logo.naturalWidth)ctx.drawImage(this.logo,w*.39,h*.23,w*.22,w*.22);ctx.restore();text(APP_NAME,.46,.072,'#536c60',fade);text('Peindre avec le chant des oiseaux.',.53,.042,'#536c60',fade);if(time>=12){const a=clamp((time-12)/.5);text('À ton tour de faire résonner le vivant.',.64,.039,'#536c60',a);text(this.site,.70,.031,'#536c60',a);}text('•°',.79,.046,'#a3443d',fade);text('Chant : '+this.credit.author,.87,.026,'#6f7b74',fade);text(this.credit.license,.90,.023,'#6f7b74',fade);text(this.credit.source.replace(/^https?:\/\//,''),.93,.021,'#6f7b74',fade);}
 }
 dispose(){const gl=this.gl;gl.deleteTexture(this.texture);gl.deleteBuffer(this.buffer);gl.deleteBuffer(this.indexBuffer);gl.deleteVertexArray(this.vao);gl.deleteProgram(this.program);gl.getExtension('WEBGL_lose_context')?.loseContext();this.surface.width=this.surface.height=1;}
}
