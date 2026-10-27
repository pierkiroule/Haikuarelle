"""Actual material sampler: reject linear atlas-cell hinges under magnification.
Requires numpy and moderngl/EGL. --source can check a previous shaders.ts.
"""
import argparse,re,json
from pathlib import Path
import numpy as np
import moderngl
parser=argparse.ArgumentParser();parser.add_argument('--source',default='src/vendor/pigment-drift/paint/shaders.ts');args=parser.parse_args()
s=Path(args.source).read_text()
match=re.search(r'vec4 materialSample\(sampler2D atlas,vec2 uv\)\s*\{([\s\S]*?)\n\}',s)
fn=match.group(0) if match else 'vec4 materialSample(sampler2D atlas,vec2 uv){return texture(atlas,uv);}'
ctx=moderngl.create_standalone_context(backend='egl',require=330)
p=ctx.program(vertex_shader='#version 330\nin vec2 aPos;void main(){gl_Position=vec4(aPos,0,1);}',fragment_shader='#version 330\nuniform sampler2D uSrc;out vec4 o;\n'+fn+'\nvoid main(){o=materialSample(uSrc,gl_FragCoord.xy/512.0);}')
a=np.zeros((32,32,4),dtype='f4');x=np.arange(32,dtype='f4');a[:,:,:]=(.5+.3*np.sin(x*.63)+.1*np.cos(x*1.31))[None,:,None]
t=ctx.texture((32,32),4,a.tobytes(),dtype='f4');t.filter=(moderngl.LINEAR,moderngl.LINEAR);t.repeat_x=False;t.repeat_y=False;t.use(0)
out=ctx.texture((512,512),4,dtype='f4');f=ctx.framebuffer([out]);f.use()
b=ctx.buffer(np.array([-1,-1,1,-1,-1,1,1,1],dtype='f4').tobytes());vao=ctx.simple_vertex_array(p,b,'aPos');vao.render(moderngl.TRIANGLE_STRIP)
r=np.frombuffer(out.read(),dtype='f4').reshape(512,512,4)[256,:,0]
curvature=np.abs(r[2:]-2*r[1:-1]+r[:-2]);knots=np.arange(39,470,16)-1;centers=knots+8
seam=float(np.mean(curvature[knots]));inside=float(np.mean(curvature[centers]));ratio=seam/max(inside,1e-9)
print(json.dumps({'seamCurvature':seam,'insideCurvature':inside,'hingeRatio':ratio,'range':[float(r.min()),float(r.max())]}),flush=True)
assert ratio<1.8, f'Visible atlas-cell hinges: {ratio}'
assert r.max()-r.min()>.5,'Material contrast must survive reconstruction'
