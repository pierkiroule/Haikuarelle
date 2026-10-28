import {flightMatrix,flightMesh,processState,pigmentFocus,smooth,type Vec3} from './flight';
import {paintingBounds} from './framing';
import {APP_NAME,publicSiteAddress} from '../brand';
import {loadPoetryFont,POETRY_FONT} from '../birds/FixedPoetry';
import type {BirdSound} from '../birds/BirdAudioBank';
import type {ArtworkPoetry} from '../birds/artworkPoetry';
import {soundAt,visualTime} from './score';
const vertex=`#version 300 es
precision highp float;
in vec2 aUV;
uniform sampler2D uImage;
uniform vec3 uPaper;
uniform float uRatio,uTime,uEnergy,uTreble,uFlux,uFluidity;
uniform mat4 uViewProjection;
out vec2 vUV;out vec3 vNormal;
vec3 surface(vec2 uv){
 float u=uv.x,v=uv.y,h=2./max(1.,uRatio),w=h*uRatio;
 float wave=.30*sin(u*5.1+v*3.7-uTime*.65)+.13*cos(v*8.3-u*2.6+uTime*.43);
 float resonance=(.055*uEnergy+.045*uFlux)*sin(u*13.+v*9.-uTime*3.2)+.018*uTreble*sin(v*23.-uTime*4.);
 float lod=max(0.,log2(float(textureSize(uImage,0).x)/192.));
 float density=clamp(length(max(vec3(0.),uPaper-textureLod(uImage,uv,lod).rgb))*1.3,0.,1.);
 float x=(u-.5)*w,y=(.5-v)*h,twist=uFluidity*(.95*sin(v*4.7+uTime*.38)+.35*sin(uTime*.27));
 return vec3(x*cos(twist)+.09*uFluidity*sin(v*7.+uTime*.32),y+.09*uFluidity*cos(u*6.-uTime*.4),-x*sin(twist)+uFluidity*(wave+resonance)+density*.026);
}
void main(){
 vUV=aUV;vec3 pos=surface(aUV);
 vec3 du=surface(aUV+vec2(.001,0.))-surface(aUV-vec2(.001,0.));
 vec3 dv=surface(aUV+vec2(0.,.001))-surface(aUV-vec2(0.,.001));
 vNormal=normalize(cross(du,dv));gl_Position=uViewProjection*vec4(pos,1.);
}`;
const fragment=`#version 300 es
precision highp float;
uniform sampler2D uImage;uniform vec3 uPaper;
uniform float uOpacity,uTime,uEmergence,uDiffusion,uDrying;
in vec2 vUV;in vec3 vNormal;out vec4 outColor;
void main(){
 // Coarse-to-fine optical emergence: original UVs and the original painting stay intact.
 vec3 ink=texture(uImage,vUV).rgb;
 float difference=length(max(vec3(0.),uPaper-ink));
 float alpha=smoothstep(.018,.12,difference);
 float field=.5+.20*sin(vUV.x*9.1+vUV.y*5.7)+.15*cos(vUV.y*11.3-vUV.x*3.2)+.10*sin(vUV.x*19.+vUV.y*13.);
 float reveal=1.-smoothstep(uEmergence*1.4-.32,uEmergence*1.4+.08,field);
 alpha*=reveal;
 if(alpha<.002)discard;
 float matte=smoothstep(.018,.12,difference);
 vec3 color=clamp((ink-uPaper*(1.-matte))/max(matte,.001),0.,1.);
 vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;
 float light=.78+.22*abs(dot(n,normalize(vec3(-.35,.5,1.))));
 float wet=(1.-uDrying)*uDiffusion;
 float sheen=pow(max(0.,dot(n,normalize(vec3(-.4,.65,1.4)))),28.)*.13*wet;
 float rim=pow(1.-abs(n.z),3.)*.07*wet;
 // Water-light follows the moving surface without washing away the HD pigment detail.
 outColor=vec4(clamp(color*light+vec3(sheen+rim),0.,1.),alpha*uOpacity);
}`;
export interface DanceCredit{author:string;license:string;source:string}
export class DanceRenderer{
 private gl:WebGL2RenderingContext;private program:WebGLProgram;private texture:WebGLTexture;private vao:WebGLVertexArrayObject;private buffer:WebGLBuffer;private count=0;private indexBuffer:WebGLBuffer;
 private surface=document.createElement('canvas');private ctx:CanvasRenderingContext2D;private ratio:number;private paper:number[];private focus:Vec3[]=[];
 private site=publicSiteAddress(location.href);
 private uniforms=new Map<string,WebGLUniformLocation|null>();
 private constructor(readonly canvas:HTMLCanvasElement,image:ImageBitmap,readonly poetry:ArtworkPoetry,readonly sound:BirdSound,paper:string,readonly credit:DanceCredit){
  this.ratio=image.width/image.height;this.paper=[1,3,5].map(i=>parseInt(paper.slice(i,i+2),16)/255);
  const gl=this.surface.getContext('webgl2',{alpha:true,antialias:true,preserveDrawingBuffer:false});
  const ctx=canvas.getContext('2d',{alpha:false});if(!gl||!ctx)throw new Error('La danse nécessite WebGL2. Ton image reste disponible.');this.gl=gl;this.ctx=ctx;
  const shaders:WebGLShader[]=[];
  const compile=(type:number,source:string)=>{const shader=gl.createShader(type)!;shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error('La danse ne peut pas ouvrir sa surface 3D.');return shader;};
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
   const scene=new DanceRenderer(canvas,image,poetry,sound,paper,credit);
   ctx.clearRect(0,0,probe.width,probe.height);ctx.drawImage(image,0,0,probe.width,probe.height);
   scene.focus=pigmentFocus(ctx.getImageData(0,0,probe.width,probe.height).data,probe.width,probe.height,rgb,image.width/image.height);
   return scene;
  }finally{image?.close();original.close();probe.width=probe.height=1;}
 }
 private uniform(name:string){if(!this.uniforms.has(name))this.uniforms.set(name,this.gl.getUniformLocation(this.program,name));return this.uniforms.get(name)!;}
 draw(time:number){
  const {canvas,gl,ctx}=this,w=canvas.width,h=canvas.height;
  if(gl.isContextLost())throw new Error('La surface 3D a été interrompue. Ferme puis rouvre la danse.');
  if(this.surface.width!==w||this.surface.height!==h){this.surface.width=w;this.surface.height=h;}
  const t=visualTime(time),state=processState(t),matrix=flightMatrix(t,w/h,this.focus,this.ratio),opacity=smooth(0,.65,t)*(1-smooth(29.3,30,t));
  gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  gl.useProgram(this.program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.uniform1i(this.uniform('uImage'),0);gl.uniform3fv(this.uniform('uPaper'),this.paper);gl.uniform1f(this.uniform('uRatio'),this.ratio);gl.uniform1f(this.uniform('uTime'),t);gl.uniform1f(this.uniform('uOpacity'),opacity);gl.uniformMatrix4fv(this.uniform('uViewProjection'),false,matrix);
  const sound=soundAt(this.sound.analysis,t);for(const [key,value]of Object.entries(sound))gl.uniform1f(this.uniform('u'+key[0].toUpperCase()+key.slice(1)),value);
  for(const key of ['emergence','diffusion','drying','fluidity'] as const)gl.uniform1f(this.uniform('u'+key[0].toUpperCase()+key.slice(1)),state[key]);
  gl.bindVertexArray(this.vao);gl.drawElements(gl.TRIANGLES,this.count,gl.UNSIGNED_SHORT,0);
  const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#fafbf9');sky.addColorStop(.7,'#fff');sky.addColorStop(1,'#fafcfb');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);ctx.drawImage(this.surface,0,0);
  const text=(value:string,y:number,size:number,color='#35483e',alpha=.8)=>{ctx.save();ctx.fillStyle=color;ctx.globalAlpha=alpha;ctx.textAlign='center';ctx.textBaseline='middle';const unit=Math.min(w,h*9/16);ctx.font=`${size*unit}px ${POETRY_FONT}`;const width=ctx.measureText(value).width;if(width>w*.84)ctx.font=`${size*unit*w*.84/width}px ${POETRY_FONT}`;ctx.fillText(value,w/2,h*y);ctx.restore();};
  const visual=visualTime(time),verse=Math.min(2,Math.floor(visual/10)),phase=visual%10;
  text(this.poetry.title,.10,.050);
  text(this.poetry.verses[verse],.83,.049,'#35483e',.8*Math.min(1,phase/.45,(10-phase)/.45));
  text(APP_NAME+' · •°',.915,.029,'#8a6258',.72);text(this.site,.943,.019,'#6f7b74',.65);
  text(this.credit.author+' · '+this.credit.license,.966,.017,'#6f7b74',.6);
  text(this.credit.source.replace(/^https?:\/\//,''),.985,.014,'#6f7b74',.55);

 }
 dispose(){const gl=this.gl;gl.deleteTexture(this.texture);gl.deleteBuffer(this.buffer);gl.deleteBuffer(this.indexBuffer);gl.deleteVertexArray(this.vao);gl.deleteProgram(this.program);gl.getExtension('WEBGL_lose_context')?.loseContext();this.surface.width=this.surface.height=1;}
}
