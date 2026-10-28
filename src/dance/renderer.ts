import {flightMatrix,flightMesh,birdMotion,birdModel,smooth,FLOCK_COUNT} from './flight';
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
uniform float uRatio,uRoot,uTime,uEnergy,uBass,uTreble,uFlux;
uniform mat4 uViewProjection,uModel;
uniform vec4 uMotion;
uniform int uPart;
out vec2 vUV;out vec3 vNormal;flat out int vKind;
void main(){
 vUV=aUV;int kind=gl_InstanceID+uPart;vKind=kind;vec3 pos,normal;
 if(kind<2){
  float side=kind==0?-1.:1.,u=aUV.x,v=aUV.y,height=min(1.05,.9/uRatio),width=height*uRatio,reach=(u-uRoot)*width;
  float fold=uMotion.y,phase=uMotion.z,angle=uMotion.x+.035*uFlux*(1.-fold)*sin(phase),ca=cos(angle),sa=sin(angle),flex=(.045*sin(phase-.7)*(.7+.3*uEnergy)+.008*uTreble*sin(uTime*10.))*(1.-fold),sp=sin(u*3.14159265),cp=cos(u*3.14159265);
  vec3 open=vec3(side*(.025+reach*ca),.09+reach*sa+flex*sp,(v-.5)*height*(1.-.65*u)+.18*u*u);
  vec3 folded=vec3(side*(.07+.06*u),.12-.11*u+.015*sin(v*3.14159265),(v-.5)*.36+.20*u+.05);
  pos=mix(open,folded,fold);
  vec3 du=mix(vec3(side*width*ca,width*sa+flex*3.14159265*cp,-.65*(v-.5)*height+.36*u),vec3(side*.06,-.11,.20),fold);
  vec3 dv=mix(vec3(0.,0.,height*(1.-.65*u)),vec3(0.,.015*3.14159265*cos(v*3.14159265),.36),fold);
  normal=normalize(cross(du,dv));
  float lod=max(0.,log2(max(float(textureSize(uImage,0).x)/128.,float(textureSize(uImage,0).y)/176.))+1.);
  float density=clamp(length(max(vec3(0.),uPaper-textureLod(uImage,aUV,lod).rgb))*1.3,0.,1.);
  pos+=normal*density*.018;
 }

 vNormal=mat3(uModel)*normal;
 gl_Position=uViewProjection*uModel*vec4(pos,1.);
}`;
const fragment=`#version 300 es
precision highp float;
uniform sampler2D uImage;uniform vec3 uPaper;uniform float uOpacity;
in vec2 vUV;in vec3 vNormal;flat in int vKind;out vec4 outColor;
void main(){
 vec3 ink=texture(uImage,vUV).rgb;
 float difference=length(max(vec3(0.),uPaper-ink));
 // Soft matting preserves washes; never use a hard white-key threshold.
 float alpha=smoothstep(.018,.12,difference);
 if(vKind<2&&alpha<.002)discard;
 vec3 color=clamp((ink-uPaper*(1.-alpha))/max(alpha,.001),0.,1.);

 vec3 normal=normalize(vNormal);
 float light=.84+.16*abs(dot(normal,normalize(vec3(-.35,.5,1.))));
 outColor=vec4(color*light,alpha*uOpacity);
}`;
export interface DanceCredit{author:string;license:string;source:string}
export class DanceRenderer{
 private gl:WebGL2RenderingContext;private program:WebGLProgram;private texture:WebGLTexture;private vao:WebGLVertexArrayObject;private buffer:WebGLBuffer;private count=0;private indexBuffer:WebGLBuffer;private root=.16;
 private surface=document.createElement('canvas');private ctx:CanvasRenderingContext2D;private ratio:number;private paper:number[];
 private site=publicSiteAddress(location.href);
 private uniforms=new Map<string,WebGLUniformLocation|null>();
 private constructor(readonly canvas:HTMLCanvasElement,image:ImageBitmap,readonly poetry:ArtworkPoetry,readonly sound:BirdSound,paper:string,readonly credit:DanceCredit){
  this.ratio=image.width/image.height;this.paper=[1,3,5].map(i=>parseInt(paper.slice(i,i+2),16)/255);
  const gl=this.surface.getContext('webgl2',{alpha:true,antialias:true,preserveDrawingBuffer:false});
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
   const scene=new DanceRenderer(canvas,image,poetry,sound,paper,credit);
   return scene;
  }finally{image?.close();original.close();probe.width=probe.height=1;}
 }
 private uniform(name:string){if(!this.uniforms.has(name))this.uniforms.set(name,this.gl.getUniformLocation(this.program,name));return this.uniforms.get(name)!;}
 draw(time:number){
  const {canvas,gl,ctx}=this,w=canvas.width,h=canvas.height;
  if(gl.isContextLost())throw new Error('La surface 3D a été interrompue. Ferme puis rouvre la danse.');
  if(this.surface.width!==w||this.surface.height!==h){this.surface.width=w;this.surface.height=h;}
  const t=visualTime(time),motion=birdMotion(t),matrix=flightMatrix(t,w/h),opacity=smooth(0,.65,t)*(1-smooth(29.3,30,t));
  gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
  gl.useProgram(this.program);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture);gl.uniform1i(this.uniform('uImage'),0);gl.uniform3fv(this.uniform('uPaper'),this.paper);gl.uniform1f(this.uniform('uRatio'),this.ratio);gl.uniform1f(this.uniform('uRoot'),this.root);gl.uniform1f(this.uniform('uTime'),t);gl.uniform1f(this.uniform('uOpacity'),opacity);gl.uniform4fv(this.uniform('uMotion'),[motion.flap,motion.fold,motion.phase,motion.feet]);gl.uniformMatrix4fv(this.uniform('uModel'),false,birdModel(t));gl.uniformMatrix4fv(this.uniform('uViewProjection'),false,matrix);
  const sound=soundAt(this.sound.analysis,t);for(const [key,value]of Object.entries(sound))gl.uniform1f(this.uniform('u'+key[0].toUpperCase()+key.slice(1)),value);
  gl.bindVertexArray(this.vao);gl.uniform1i(this.uniform('uPart'),0);
  // Shared HD texture and indexed wing mesh; six lightweight draw calls, no anatomy.
  for(let i=0;i<FLOCK_COUNT;i++){
   const state=birdMotion(t,i);
   gl.uniform4fv(this.uniform('uMotion'),[state.flap,0,state.phase,0]);
   gl.uniformMatrix4fv(this.uniform('uModel'),false,birdModel(t,i));
   gl.drawElementsInstanced(gl.TRIANGLES,this.count,gl.UNSIGNED_SHORT,0,2);
  }
  const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#f0f7fc');sky.addColorStop(.7,'#fff');sky.addColorStop(1,'#fafcfb');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);ctx.drawImage(this.surface,0,0);
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
