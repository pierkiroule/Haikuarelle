import type {InkStroke} from './types';
import {SHEETS,type SheetSize} from './layout';

const VERTEX=`#version 300 es
precision highp float;
layout(location=0) in vec2 aPosition;
layout(location=1) in float aSide;
layout(location=2) in float aBorn;
layout(location=3) in float aOpacity;
layout(location=4) in float aAlong;
layout(location=5) in float aSeed;
uniform vec2 uSheet;
out float vSide,vBorn,vOpacity,vAlong,vSeed;
out vec2 vPaper;
void main(){
  vPaper=aPosition*uSheet*(768.0/min(uSheet.x,uSheet.y));
  vSide=aSide;vBorn=aBorn;vOpacity=aOpacity;vAlong=aAlong;vSeed=aSeed;
  gl_Position=vec4(aPosition.x*2.0-1.0,1.0-aPosition.y*2.0,0.0,1.0);
}`;
const FRAGMENT=`#version 300 es
precision highp float;
uniform float uTime;
uniform vec3 uColor;
in float vSide,vBorn,vOpacity,vAlong,vSeed;
in vec2 vPaper;
out vec4 fragColor;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
void main(){
  float reveal=smoothstep(0.0,0.07,uTime-vBorn);
  if(reveal<=0.0)discard;
  float fiber=noise(vPaper*vec2(.14,.78)+vSeed);
  float rag=.75+.25*noise(vPaper*.51+vSeed*.13);
  float aa=max(fwidth(vSide),.04);
  float coverage=1.0-smoothstep(rag-aa,rag+aa,abs(vSide));
  float dryBreak=smoothstep(.12,.28,noise(vec2(vAlong*47.0,vSeed*.071)));
  float alpha=coverage*reveal*vOpacity*(.66+.34*fiber)*dryBreak;
  fragColor=vec4(uColor,alpha);
}`;

/** Dry fine ink is drawn on the existing paint FBO, including export FBOs. */
export class FineInkRenderer {
  private program:WebGLProgram;
  private vao:WebGLVertexArrayObject;
  private buffer:WebGLBuffer;
  private count=0;
  private vertices=new Float32Array(0);
  private used=0;
  private sheet:SheetSize=SHEETS.landscape;
  private sheetUniform:WebGLUniformLocation|null;
  private timeUniform:WebGLUniformLocation|null;
  private colorUniform:WebGLUniformLocation|null;
  constructor(private gl:WebGL2RenderingContext){
    const compile=(type:number,source:string)=>{
      const shader=gl.createShader(type)!;gl.shaderSource(shader,source);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader)||'Compilation de l’encre impossible.');
      return shader;
    };
    const vs=compile(gl.VERTEX_SHADER,VERTEX),fs=compile(gl.FRAGMENT_SHADER,FRAGMENT);
    const program=gl.createProgram()!;gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
    gl.deleteShader(vs);gl.deleteShader(fs);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'Initialisation de l’encre impossible.');
    this.program=program;this.vao=gl.createVertexArray()!;this.buffer=gl.createBuffer()!;
    this.sheetUniform=gl.getUniformLocation(program,'uSheet');
    this.timeUniform=gl.getUniformLocation(program,'uTime');this.colorUniform=gl.getUniformLocation(program,'uColor');
    gl.bindVertexArray(this.vao);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
    const sizes=[2,1,1,1,1,1];let offset=0;
    for(let i=0;i<sizes.length;i++){
      gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,sizes[i],gl.FLOAT,false,7*4,offset*4);offset+=sizes[i];
    }
  }
  setStrokes(strokes:InkStroke[],sheet:SheetSize=SHEETS.landscape):void{
    this.sheet=sheet;
    this.used=0;this.count=0;
    this.appendStrokes(strokes);
  }
  /** Stream only new line vertices; do not rebuild the whole signature each tick. */
  appendStrokes(strokes:InkStroke[]):void{
    const added=this.geometry(strokes);if(!added.length)return;
    const required=this.used+added.length,gl=this.gl;
    gl.bindVertexArray(this.vao);gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
    if(required>this.vertices.length){
      const grown=new Float32Array(Math.max(16384,2**Math.ceil(Math.log2(required))));
      grown.set(this.vertices.subarray(0,this.used));this.vertices=grown;
      this.vertices.set(added,this.used);
      gl.bufferData(gl.ARRAY_BUFFER,this.vertices.byteLength,gl.DYNAMIC_DRAW);
      gl.bufferSubData(gl.ARRAY_BUFFER,0,this.vertices.subarray(0,required));
    }else{
      this.vertices.set(added,this.used);gl.bufferSubData(gl.ARRAY_BUFFER,this.used*4,added);
    }
    this.used=required;this.count=required/7;
  }
  private geometry(strokes:InkStroke[]):Float32Array{
    const sheet=this.sheet;
    const vertices:number[]=[];
    for(const stroke of strokes){
      const ps=stroke.points,n=ps.length;
      if(n<2)continue;
      const visible=stroke.stop===undefined?1:Math.max(0,Math.min(1,(stroke.stop-stroke.start)/stroke.duration));
      const side=(i:number,sign:number)=>{
        const a=ps[Math.max(0,i-1)],b=ps[Math.min(n-1,i+1)];
        const dx=(b.x-a.x)*sheet.width,dy=(b.y-a.y)*sheet.height,l=Math.hypot(dx,dy)||1,u=i/(n-1);
        const pressure=(stroke.continuous?1:.30+.70*Math.sin(Math.PI*u)**.55)*(1+.13*Math.sin(i*.71+stroke.seed));
        const half=stroke.width*.5*pressure*Math.min(sheet.width,sheet.height)/768;
        return [ps[i].x+sign*(-dy/l)*half/sheet.width,ps[i].y+sign*(dx/l)*half/sheet.height,
          sign,stroke.start+u*stroke.duration,stroke.opacity,u,stroke.seed];
      };
      for(let i=0;i<n-1&&(i+1)/(n-1)<=visible;i++)for(const [j,s] of [[i,-1],[i,1],[i+1,-1],[i+1,-1],[i,1],[i+1,1]])vertices.push(...side(j,s));
    }
    return new Float32Array(vertices);
  }
  draw(time:number,color:[number,number,number]):void{
    if(!this.count)return;
    const gl=this.gl;
    gl.useProgram(this.program);gl.bindVertexArray(this.vao);
    gl.uniform2f(this.sheetUniform,this.sheet.width,this.sheet.height);
    gl.uniform1f(this.timeUniform,time);gl.uniform3f(this.colorUniform,...color);
    gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES,0,this.count);
    gl.disable(gl.BLEND);
  }
  destroy():void{this.gl.deleteBuffer(this.buffer);this.gl.deleteVertexArray(this.vao);this.gl.deleteProgram(this.program);}
}
