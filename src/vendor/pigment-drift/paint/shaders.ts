// GLSL for the paint studio.
//
// The sheet is a pigment field:
//   R  how much pigment lies on the paper (0 = bare)
//   G  how wet the paper is
//   BA how much of that pigment is the second and third ink (the rest is the first)
// The inks are stored premultiplied (amount of each ink, not its share), so
// pushing, stirring, bleeding and blotting move them exactly like the pigment.
// A small fluid sim moves the field, wet areas bleed, and the render pass cuts
// it into stacked washes the way the generator cuts its procedural height field,
// so every stroke dries into the same pigment drift look.

export const VERTEX = /* glsl */ `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const HEAD = /* glsl */ `#version 300 es
precision highp float;
precision highp sampler2D;
`;

/** Noise shared with the generator shader (same PCG lattice, so textures match). */
const NOISE = /* glsl */ `
const float TAU = 6.28318530718;
const mat2 ROT = mat2(0.80, 0.60, -0.60, 0.80);

vec2 hash22(vec2 p) {
  uvec2 v = uvec2(ivec2(p));
  v = v * 1664525u + 1013904223u;
  v.x += v.y * 1664525u;
  v.y += v.x * 1664525u;
  v ^= v >> 16u;
  v.x += v.y * 1664525u;
  v.y += v.x * 1664525u;
  v ^= v >> 16u;
  return vec2(v) * (1.0 / 4294967295.0);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float gnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = dot(hash22(i) * 2.0 - 1.0, f);
  float b = dot(hash22(i + vec2(1.0, 0.0)) * 2.0 - 1.0, f - vec2(1.0, 0.0));
  float c = dot(hash22(i + vec2(0.0, 1.0)) * 2.0 - 1.0, f - vec2(0.0, 1.0));
  float d = dot(hash22(i + vec2(1.0, 1.0)) * 2.0 - 1.0, f - vec2(1.0, 1.0));
  return 1.4 * mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p, int octaves) {
  float sum = 0.0, amp = 0.5, norm = 0.0;
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    sum += amp * gnoise(p);
    norm += amp;
    p = ROT * p * 2.03 + vec2(17.1, 9.3);
    amp *= 0.5;
  }
  return sum / norm;
}
`;

/**
 * Pigment amount <-> the generator's wash height (0 = deepest, 1 = the palest wash's
 * edge). The last sliver of pigment stands for the mist above that edge, up to bare
 * paper at H_BARE, so soft edges and haze fade out before the pigment runs out.
 */
const HEIGHT = /* glsl */ `
const float P_EDGE = 0.08 / 1.08;
const float H_BARE = 1.4;
float heightOf(float p) {
  return p >= P_EDGE ? 1.08 - 1.08 * p : H_BARE - (H_BARE - 1.0) * p / P_EDGE;
}
float pigmentOf(float h) {
  return h <= 1.0 ? (1.08 - h) / 1.08 : P_EDGE * max(H_BARE - h, 0.0) / (H_BARE - 1.0);
}
`;

// ---------------------------------------------------------------- utilities

/**
 * Copies (and if needed rescales) a texture into a target: source texel = frag * uMap.xy + uMap.zw.
 * Beyond the source's edge its border carries on, so a grown sheet has no seam.
 */
export const COPY = HEAD + /* glsl */ `
uniform sampler2D uSrc;
uniform vec4 uMap;
out vec4 o;
void main() {
  vec2 size = vec2(textureSize(uSrc, 0));
  vec2 p = clamp(gl_FragCoord.xy * uMap.xy + uMap.zw, vec2(0.5), size - 0.5);
  o = texture(uSrc, p / size);
}
`;

/** Fills a target with one value (clearing velocity, pressure, a blank sheet). */
export const FILL = HEAD + /* glsl */ `
uniform vec4 uValue;
out vec4 o;
void main() { o = uValue; }
`;

/**
 * The sheet in four bytes per texel, for undo snapshots and saving:
 * pigment as 16 bits, then the second and third inks' shares as 8 bits each.
 * (Wetness isn't kept: a restored sheet is dry.)
 */
export const ENCODE = HEAD + /* glsl */ `
uniform sampler2D uSrc;
out vec4 o;
void main() {
  vec4 f = texelFetch(uSrc, ivec2(gl_FragCoord.xy), 0);
  float v = floor(clamp(f.x * 0.5, 0.0, 1.0) * 65535.0 + 0.5);
  vec2 share = f.x > 1e-4 ? clamp(f.zw / f.x, 0.0, 1.0) : vec2(0.0);
  o = vec4(floor(v / 256.0) / 255.0, mod(v, 256.0) / 255.0, share);
}
`;

/** uInks = 0 reads the older two-byte format (pigment only, all first ink). */
export const DECODE = HEAD + /* glsl */ `
uniform sampler2D uSrc;
uniform float uInks;
out vec4 o;
void main() {
  vec4 b = texelFetch(uSrc, ivec2(gl_FragCoord.xy), 0);
  float p = (floor(b.x * 255.0 + 0.5) * 256.0 + floor(b.y * 255.0 + 0.5)) / 65535.0 * 2.0;
  o = vec4(p, 0.0, b.zw * p * uInks);
}
`;

/** Eases the sheet toward another one (new sheets arrive by flowing into place). */
export const SETTLE = HEAD + /* glsl */ `
uniform sampler2D uSrc;
uniform sampler2D uTarget;
uniform float uAmount;
out vec4 o;
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  vec4 a = texelFetch(uSrc, p, 0);
  vec4 b = texelFetch(uTarget, p, 0);
  o = vec4(mix(a.x, b.x, uAmount), a.y * (1.0 - uAmount), mix(a.zw, b.zw, uAmount));
}
`;

// ---------------------------------------------------------------- fluid

const SEGMENTS = /* glsl */ `
const int MAX_SEGS = 16;
uniform int uSegCount;
uniform vec4 uSeg[MAX_SEGS];   // a.xy, b.xy in field texels

float segDist(vec2 p, vec4 s, out float along) {
  vec2 ab = s.zw - s.xy;
  float t = clamp(dot(p - s.xy, ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);
  along = t;
  return length(p - s.xy - ab * t);
}
`;

/** Self-advection plus the pull of every finger. Velocity is in field texels per second. */
export const VEL_STEP = HEAD + SEGMENTS + /* glsl */ `
uniform sampler2D uVel;
uniform vec2 uVelSize;
uniform vec2 uFieldSize;
uniform float uDt;
uniform float uKeep;
uniform vec4 uForce[MAX_SEGS];  // velocity.xy, radius, coupling
out vec4 o;
void main() {
  vec2 uv = gl_FragCoord.xy / uVelSize;
  vec2 v = texture(uVel, uv).xy;
  v = texture(uVel, uv - v * uDt / uFieldSize).xy * uKeep;
  vec2 q = uv * uFieldSize;
  for (int i = 0; i < MAX_SEGS; i++) {
    if (i >= uSegCount) break;
    vec4 f = uForce[i];
    if (f.w <= 0.0) continue;
    float t;
    float d = segDist(q, uSeg[i], t);
    float k = exp(-d * d / (f.z * f.z));
    v += (f.xy - v) * k * f.w;
  }
  o = vec4(v, 0.0, 1.0);
}
`;

export const CURL = HEAD + /* glsl */ `
uniform sampler2D uVel;
out vec4 o;
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  ivec2 m = textureSize(uVel, 0) - 1;
  float L = texelFetch(uVel, clamp(p - ivec2(1, 0), ivec2(0), m), 0).y;
  float R = texelFetch(uVel, clamp(p + ivec2(1, 0), ivec2(0), m), 0).y;
  float T = texelFetch(uVel, clamp(p + ivec2(0, 1), ivec2(0), m), 0).x;
  float B = texelFetch(uVel, clamp(p - ivec2(0, 1), ivec2(0), m), 0).x;
  o = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}
`;

/** Vorticity confinement: keeps small eddies alive so stirring curls instead of smearing. */
export const VORTICITY = HEAD + /* glsl */ `
uniform sampler2D uVel;
uniform sampler2D uCurl;
uniform float uStrength;
uniform float uDt;
out vec4 o;
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  ivec2 m = textureSize(uCurl, 0) - 1;
  float L = texelFetch(uCurl, clamp(p - ivec2(1, 0), ivec2(0), m), 0).x;
  float R = texelFetch(uCurl, clamp(p + ivec2(1, 0), ivec2(0), m), 0).x;
  float T = texelFetch(uCurl, clamp(p + ivec2(0, 1), ivec2(0), m), 0).x;
  float B = texelFetch(uCurl, clamp(p - ivec2(0, 1), ivec2(0), m), 0).x;
  float C = texelFetch(uCurl, p, 0).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 1e-4;
  force *= uStrength * C * vec2(1.0, -1.0);
  vec2 v = texelFetch(uVel, p, 0).xy + force * uDt;
  o = vec4(v, 0.0, 1.0);
}
`;

export const DIVERGENCE = HEAD + /* glsl */ `
uniform sampler2D uVel;
out vec4 o;
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  ivec2 m = textureSize(uVel, 0) - 1;
  vec2 C = texelFetch(uVel, p, 0).xy;
  // Walls: the edge of the paper reflects the flow back.
  float L = p.x > 0 ? texelFetch(uVel, p - ivec2(1, 0), 0).x : -C.x;
  float R = p.x < m.x ? texelFetch(uVel, p + ivec2(1, 0), 0).x : -C.x;
  float B = p.y > 0 ? texelFetch(uVel, p - ivec2(0, 1), 0).y : -C.y;
  float T = p.y < m.y ? texelFetch(uVel, p + ivec2(0, 1), 0).y : -C.y;
  o = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}
`;

export const SCALE = HEAD + /* glsl */ `
uniform sampler2D uSrc;
uniform float uAmount;
out vec4 o;
void main() { o = texelFetch(uSrc, ivec2(gl_FragCoord.xy), 0) * uAmount; }
`;

export const JACOBI = HEAD + /* glsl */ `
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
out vec4 o;
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  ivec2 m = textureSize(uPressure, 0) - 1;
  float L = texelFetch(uPressure, clamp(p - ivec2(1, 0), ivec2(0), m), 0).x;
  float R = texelFetch(uPressure, clamp(p + ivec2(1, 0), ivec2(0), m), 0).x;
  float T = texelFetch(uPressure, clamp(p + ivec2(0, 1), ivec2(0), m), 0).x;
  float B = texelFetch(uPressure, clamp(p - ivec2(0, 1), ivec2(0), m), 0).x;
  float div = texelFetch(uDivergence, p, 0).x;
  o = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
}
`;

export const GRADIENT = HEAD + /* glsl */ `
uniform sampler2D uPressure;
uniform sampler2D uVel;
out vec4 o;
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  ivec2 m = textureSize(uPressure, 0) - 1;
  float L = texelFetch(uPressure, clamp(p - ivec2(1, 0), ivec2(0), m), 0).x;
  float R = texelFetch(uPressure, clamp(p + ivec2(1, 0), ivec2(0), m), 0).x;
  float T = texelFetch(uPressure, clamp(p + ivec2(0, 1), ivec2(0), m), 0).x;
  float B = texelFetch(uPressure, clamp(p - ivec2(0, 1), ivec2(0), m), 0).x;
  vec2 v = texelFetch(uVel, p, 0).xy - 0.5 * vec2(R - L, T - B);
  o = vec4(v, 0.0, 1.0);
}
`;

// ---------------------------------------------------------------- the sheet

/**
 * One step of the pigment field: drops push the floating pigment outward
 * (suminagashi), the water carries it, wet paper lets it bleed, brushes lay
 * it down or lift it, and everything slowly dries.
 */
export const FIELD_STEP = HEAD + NOISE + SEGMENTS + /* glsl */ `
uniform sampler2D uField;
uniform sampler2D uVel;
uniform vec2 uSize;
// HAÏKUARELLE optical basis; the original three-ink representation is retained
// unless explicitly enabled. Coefficients are linear absorption / 8.
uniform float uOptical;
uniform vec3 uAbsorption[32];
uniform float uDt;
uniform float uFlowing;
// Active breath only: center, air velocity; radius and bounded coupling.
uniform vec4 uBreath;
uniform vec2 uBreathShape;
uniform float uBleed;        // 0..1 how far wet pigment spreads
uniform float uDryKeep;      // wetness multiplier this step
uniform float uMaterial;     // ritual: capillary transport and colour separation
uniform float uDryFloor;     // upstream linear loss, disabled for the prepared-water guide
uniform vec2 uSeedOff;
uniform float uUnit;         // one sheet unit, in field texels

const int MAX_DROPS = 4;
uniform int uDropCount;
uniform vec4 uDrop[MAX_DROPS];     // center.xy, r0^2, r1^2 (texels)
uniform vec4 uDropInk[MAX_DROPS];  // pigment, edge softness (texels), kind (0 ink, 1 water), ink slot

uniform vec4 uSegP[MAX_SEGS];      // radius, target pigment, strength, kind + 4 * ink slot (kinds: 0 paint, 1 water, 2 lift)

out vec4 o;

vec4 fieldAt(vec2 p) { return texture(uField, p / uSize); }

/** What a pigment amount p of ink "slot" stores in the BA channels. */
vec2 inkOf(float slot, float p) {
  if(uOptical>0.5){
    vec3 a=uAbsorption[int(clamp(slot,0.0,31.0))];
    return p*a.yz/max(a.x+a.y+a.z,1e-5);
  }
  return vec2(slot > 0.5 && slot < 1.5 ? p : 0.0, slot > 1.5 ? p : 0.0);
}
float pigmentLoad(float slot,float p){
  if(uOptical<0.5)return p;
  vec3 a=uAbsorption[int(clamp(slot,0.0,31.0))];
  return p*(a.x+a.y+a.z);
}

// Catmull-Rom (9 bilinear taps), clamped to the four nearest texels. Plain bilinear
// resampling every frame would slowly blur the rings and folds away.
vec4 fieldSharp(vec2 p) {
  vec2 pos = p - 0.5;
  vec2 i = floor(pos);
  vec2 f = pos - i;
  vec2 w0 = f * (-0.5 + f * (1.0 - 0.5 * f));
  vec2 w1 = 1.0 + f * f * (-2.5 + 1.5 * f);
  vec2 w2 = f * (0.5 + f * (2.0 - 1.5 * f));
  vec2 w3 = f * f * (-0.5 + 0.5 * f);
  vec2 w12 = w1 + w2;
  vec2 t0 = (i - 0.5) / uSize;
  vec2 t3 = (i + 2.5) / uSize;
  vec2 t12 = (i + 0.5 + w2 / w12) / uSize;
  vec4 r =
      (texture(uField, vec2(t0.x, t0.y)) * w0.x + texture(uField, vec2(t12.x, t0.y)) * w12.x + texture(uField, vec2(t3.x, t0.y)) * w3.x) * w0.y
    + (texture(uField, vec2(t0.x, t12.y)) * w0.x + texture(uField, vec2(t12.x, t12.y)) * w12.x + texture(uField, vec2(t3.x, t12.y)) * w3.x) * w12.y
    + (texture(uField, vec2(t0.x, t3.y)) * w0.x + texture(uField, vec2(t12.x, t3.y)) * w12.x + texture(uField, vec2(t3.x, t3.y)) * w3.x) * w3.y;
  ivec2 m = ivec2(uSize) - 1;
  ivec2 b = ivec2(i);
  vec4 a = texelFetch(uField, clamp(b, ivec2(0), m), 0);
  vec4 c = texelFetch(uField, clamp(b + ivec2(1, 0), ivec2(0), m), 0);
  vec4 d = texelFetch(uField, clamp(b + ivec2(0, 1), ivec2(0), m), 0);
  vec4 e = texelFetch(uField, clamp(b + ivec2(1, 1), ivec2(0), m), 0);
  return clamp(r, min(min(a, c), min(d, e)), max(max(a, c), max(d, e)));
}

void main() {
  vec2 q = gl_FragCoord.xy;
  vec2 src = q;

  // Drops: every point outside a growing drop is pushed outward so the area is
  // conserved, which squeezes the existing washes into rings around it.
  float inkCov = 0.0, inkVal = 0.0, inkKind = 0.0, inkSlot = 0.0;
  for (int i = 0; i < MAX_DROPS; i++) {
    if (i >= uDropCount) break;
    vec4 d = uDrop[i];
    vec2 rel = src - d.xy;
    // HAÏKUARELLE: clear-water blooms catch unevenly on the paper fibers.
    float bloomRag = 1.0 + (uDropInk[i].z > 0.5 ? 1.0 : 0.0) *
      (0.24 * fbm(q / uUnit * 19.0 + uSeedOff, 3) + 0.06 * gnoise(q * 0.14 + uSeedOff));
    float ds = max(dot(rel, rel) / (bloomRag * bloomRag), 1e-6);
    if (ds < d.w) {
      float r1 = sqrt(d.w);
      float cov = 1.0 - smoothstep(r1 - uDropInk[i].y, r1, sqrt(ds));
      if (cov > inkCov) { inkCov = cov; inkVal = uDropInk[i].x; inkKind = uDropInk[i].z; inkSlot = uDropInk[i].w; }
    }
    src = d.xy + rel * sqrt(max(1.0 - (d.w - d.z) / max(ds, d.w), 0.0));
  }

  float airMask=0.0;
  vec2 airSide=vec2(0.0);
  if (uFlowing > 0.5) {
    vec2 destination=src-texture(uVel,src/uSize).xy*uDt;
    if(uMaterial>0.5 && uBreathShape.y>0.0){
      float speed=length(uBreath.zw);
      vec2 direction=uBreath.zw/max(speed,0.0001);
      vec2 side=vec2(-direction.y,direction.x);
      vec2 rel=src-uBreath.xy;
      float reach=length(rel)/max(uBreathShape.x,1.0);
      float envelope=1.0-smoothstep(0.35,1.3,reach);
      airMask=envelope*min(1.0,uBreathShape.y*2.0);airSide=side;
      // Long, narrow channels, anchored in paper space rather than the frame
      // clock: the rim grows tendrils instead of shimmering or combing evenly.
      float across=dot(src,side)/uUnit;
      float along=dot(src,direction)/uUnit;
      float bend=0.32*gnoise(vec2(along*13.0,across*9.0)+uSeedOff);
      float lanes=sin(across*200.0+bend*3.0+uSeedOff.x);
      float fingers=pow(max(0.0,lanes),3.0)*(0.65+0.35*smoothstep(-0.4,0.4,gnoise(vec2(across*17.0,along*5.0)+uSeedOff)));
      float behind=fieldAt(src-direction*uUnit*0.025).x;
      float ahead=fieldAt(src+direction*uUnit*0.012).x;
      float rim=smoothstep(0.001,0.025,behind-ahead);
      float extension=min(speed*uDt*20.0,uUnit*0.03);
      destination-=direction*extension*envelope*fingers*rim*uBreathShape.y;
    }
    if(uMaterial>0.5){
      // Currents carry pigment only through a continuous wet route. Dry paper
      // and dry cuts between pools remain barriers even while the fluid coasts.
      float channel=min(fieldAt(src).y,fieldAt(destination).y);
      for(int j=1;j<=4;j++)channel=min(channel,fieldAt(mix(src,destination,float(j)/5.0)).y);
      src=mix(src,destination,smoothstep(0.008,0.07,channel));
    }else src=destination;
  }
  // Untouched texels are copied exactly (and cheaply); only moved ones are resampled.
  vec4 f = length(src - q) < 0.002 ? texelFetch(uField, ivec2(q), 0) : fieldSharp(src);

  // Prepared water is held on the cotton until explicit evaporation. Moving
  // pigment must not resample (inflate or erode) this stationary moisture mask.
  if (uDryKeep >= 1.0) f.y = texelFetch(uField, ivec2(q), 0).y;

  // Pairwise capillary exchange: mass moves toward the pinned, thinner wet
  // margin. The symmetric conductance preserves pigment instead of painting a
  // decorative outline. Mobility fades as water evaporates, leaving the rim.
  vec4 center = f;
  vec3 exchange = vec3(0.0);
  // Adjacent cells and diagonal exchange keep ONE connected, isotropic film.
  // Integer long strides used to isolate parity grids and reveal square pixels.
  float centerAffinity = 1.0 + uMaterial * 2.6 *
    (1.0-smoothstep(0.025,0.23,center.y)) * smoothstep(0.006,0.035,center.y);
  for (int axis = 0; axis < 8; axis++) {
    vec2 offset = axis == 0 ? vec2(1,0) : axis == 1 ? vec2(-1,0) : axis == 2 ? vec2(0,1) : axis == 3 ? vec2(0,-1)
      : axis == 4 ? vec2(1,1) : axis == 5 ? vec2(-1,1) : axis == 6 ? vec2(1,-1) : vec2(-1,-1);
    float weight = axis < 4 ? 1.0 : 0.5;
    vec4 neighbor = fieldAt(src + offset);
    // Sample the route too: a wider kernel cannot jump a dry slit.
    float moisture = min(min(center.y, neighbor.y),fieldAt(src + offset * 0.5).y);
    // A diagonal cannot leak across two pools touching only at a dry corner.
    if (axis >= 4) moisture = min(moisture,min(fieldAt(src+vec2(offset.x,0)).y,fieldAt(src+vec2(0,offset.y)).y));
    float fibre = 0.65 + 0.35 * smoothstep(-0.5,0.5,gnoise((src + offset * 0.5) * 0.23 + uSeedOff));
    float mobility = smoothstep(0.006,0.22,moisture) * fibre;
    float neighborAffinity = 1.0 + uMaterial * 2.6 *
      (1.0-smoothstep(0.025,0.23,neighbor.y)) * smoothstep(0.006,0.035,neighbor.y);
    // Distinct optical pigments diffuse much less across each other's boundary.
    // Empty wet cotton remains permeable, so individual colour fields spread.
    if (uMaterial > 0.5 && min(center.x,neighbor.x) > 0.015) {
      float difference = length(center.zw/max(center.x,1e-4)-neighbor.zw/max(neighbor.x,1e-4));
      mobility *= mix(1.0,0.004,smoothstep(0.015,0.08,difference));
    }
    // Air combs the moving rim: limit lateral mixing while the jets act.
    mobility*=1.0-0.92*airMask*abs(dot(normalize(offset),airSide));
    exchange += (neighbor.xzw * centerAffinity - center.xzw * neighborAffinity)
      * weight * mobility / max(centerAffinity,neighborAffinity);
  }
  f.xzw += exchange * min(0.155, uDt * mix(0.8 + 2.4*uBleed,4.0 + 3.0*uBleed,uMaterial));

  if (inkCov > 0.0) {
    if (inkKind < 0.5) {
      inkVal=pigmentLoad(inkSlot,inkVal);
      f.x = mix(f.x, inkVal, inkCov);
      f.zw = mix(f.zw, inkOf(inkSlot, inkVal), inkCov);
    } else {
      // HAÏKUARELLE: fresh water dilutes and pushes pigment, without erasing a white disc.
      f.xzw *= exp(-uDt * (0.45 + 0.50 * clamp(f.y, 0.0, 1.0)) * inkCov);
    }
    // Drops float rather than soak in, so their rings stay crisp.
    // Ritual water is supplied only by the explicit water segments. A sound
    // pulse displaces pigment; it must not refill or enlarge a prepared pool.
    if(inkKind<0.5||uMaterial<0.5)f.y=max(f.y,(inkKind<0.5?0.3:0.80)*inkCov);
  }

  // Brush texture, worked out once per texel the first time a brush comes near.
  float rag = 0.0, swell = 0.0, bloom = 0.0;
  bool shaped = false;
  for (int i = 0; i < MAX_SEGS; i++) {
    if (i >= uSegCount) break;
    vec4 sp = uSegP[i];
    float t;
    float d = segDist(q, uSeg[i], t);
    if (d > sp.x * 2.2) continue;
    if (!shaped) {
      vec2 S = q / uUnit;
      // Ragged like the generator's washes: billows, fringes and fine tatters.
      // Broad lobes, medium scallops and fine paper catches share paper
      // coordinates: moving the brush never resets the edge pattern.
      rag = fbm(S * 5.0 + uSeedOff, 3) * 0.52
          + gnoise(S * 37.0 + uSeedOff.yx) * 0.24
          + gnoise(S * 113.0 + 7.0) * 0.10;
      // Never quite even inside: the load swells and thins like its turbulence.
      swell = fbm(S * 3.0 + uSeedOff.yx + 4.4, 2) * 0.7 + gnoise(S * 9.0 + uSeedOff + 1.9) * 0.3
            + 0.32 * gnoise(S * 31.0 + uSeedOff) + 0.16 * gnoise(S * 79.0 + uSeedOff.yx);
      // And the paper takes the water unevenly, so the edge softens in some places more than others.
      bloom = smoothstep(-0.4, 0.4, gnoise(S * 2.2 + uSeedOff * 0.7 + 11.0));
      shaped = true;
    }
    float kind = mod(sp.w, 4.0);
    float slot = mod(floor(sp.w / 4.0), 64.0);
    bool wetOnly = mod(floor(sp.w / 256.0), 2.0) > 0.5;
    float wetMask = wetOnly ? smoothstep(0.005, 0.030, f.y) : 1.0;
    if (wetOnly && wetMask > 0.0) {
      // A large pale glaze must not jump a dry slit into a neighbouring pool.
      // Check the actual GPU water along the short capillary route to this texel.
      vec2 anchor = mix(uSeg[i].xy, uSeg[i].zw, t);
      float channel = f.y;
      for (int j = 1; j <= 5; j++) channel = min(channel, fieldAt(mix(anchor, q, float(j) / 6.0)).y);
      wetMask *= smoothstep(0.008, 0.025, channel);
    }
    float dn = d / sp.x + rag;
    float cov = 1.0 - smoothstep(0.5, 1.0, dn);
    // Dry-brush streaks run along the stroke.
    vec2 ab = uSeg[i].zw - uSeg[i].xy;
    float side = dot(q - uSeg[i].xy, vec2(-ab.y, ab.x)) / max(length(ab), 1e-3) / sp.x;
    float bristle = length(ab) > 0.5 ? 0.7 + 0.6 * smoothstep(-0.4, 0.4, gnoise(vec2(side * 3.2, 0.5) + uSeedOff)) : 1.0;
    if (kind < 0.5) {
      // Coherent colour planes retain subtle mineral variation without
      // procedural holes swallowing quiet notes or fragmenting every wash.
      float bodyVariation = uMaterial > 0.5 ? 0.94 + 0.16*swell : 0.91 + 0.55*swell;
      float tgt = pigmentLoad(slot,max(sp.y * bodyVariation + (uMaterial > 0.5 ? 0.008 : 0.045)*swell, 0.0));
      // The core takes the pan's pigment (and can lighten what's there)...
      float k = clamp((1.0 - smoothstep(0.2, 0.55, dn)) * sp.z * bristle * wetMask, 0.0, 1.0);
      f.x = mix(f.x, tgt, k);
      f.zw = mix(f.zw, inkOf(slot, tgt), k);
      // ...and around it the wash thins out the way the generator's do: a firm edge
      // for deep pigment, then a pale skirt that fades into mist, wider where the
      // paper drinks more. It only adds.
      float skirt = (0.06 + 0.24 * bloom * bloom) * (1.0 - 0.5 * smoothstep(0.3, 0.9, sp.y));
      float shape = 1.1 * (1.0 - smoothstep(0.4, 1.0, dn)) + skirt * (1.0 - smoothstep(0.7, 1.2 + 0.6 * bloom, dn));
      float add = (min(tgt, shape) - f.x) * wetMask;
      if (add > 0.0) {
        f.x += add;
        f.zw += inkOf(slot, add);
      }
      if (!wetOnly && sp.w < 512.0) f.y = max(f.y, (1.0 - smoothstep(1.0, 1.8, dn)) * 0.95);
    } else if (kind < 1.5) {
      // Bit 512 denotes an explicit quantity from the silent-water tool.
      float waterAmount = sp.w >= 512.0 ? clamp(sp.y, 0.0, 1.0) : 1.0;
      f.y = max(f.y, (1.0 - smoothstep(0.6, 1.25, dn)) * 0.45 * waterAmount);
    } else {
      f.xzw *= 1.0 - cov * sp.z;
      f.y *= 1.0 - cov * 0.5;
    }
  }

  f.y = max(f.y * uDryKeep - uDt * uDryFloor, 0.0);
  f.x = clamp(f.x, 0.0, 1.4);
  // The inks can never add up to more than the pigment that's there.
  f.zw = max(f.zw, 0.0);
  f.zw *= min(1.0, f.x / max(f.z + f.w, 1e-5));
  o = f;
}
`;

/**
 * A generator composition as a starting sheet: the generator's turbulent height
 * field (and its current) converted to pigment, so "Paint this" picks up the
 * piece you were looking at.
 */
export const COMPOSE = HEAD + NOISE + HEIGHT + /* glsl */ `
uniform vec2 uView;       // the viewport, in field texels
uniform vec2 uViewOff;    // its bottom-left corner inside the field
uniform vec2 uSeedOff;
uniform int uAnchor;
uniform float uCoverage, uRidge, uScale, uWarp, uFeather, uMotion;
uniform float uRiver, uRiverWidth, uRiverMeander, uRiverDepth, uRiverTilt;
out vec4 o;

float riverLine(float x, float base, float horizon, vec2 orb) {
  float k = 4.6 / uScale;
  float wave = sin(x * k + uSeedOff.x * 0.37 + orb.x * 0.6) * 0.7
             + fbm(vec2(x * k * 0.45, 3.7) + uSeedOff * 0.21 + orb * 0.3, 2) * 0.8;
  float y0 = base + uRiverTilt * 0.55 * x;
  float persp = clamp(1.0 - y0 / max(horizon, 0.05), 0.15, 1.0);
  return y0 + uRiverMeander * 0.24 * uScale * wave * (0.3 + 0.7 * persp);
}

void main() {
  vec2 frag = gl_FragCoord.xy - uViewOff;
  vec2 res = uView;
  float unit = min(res.x, res.y);
  vec2 P;
  float extent;
  if (uAnchor == 1) {
    P = vec2((0.5 * res.x - frag.x) / unit, (res.y - frag.y) / unit); extent = res.y / unit;
  } else if (uAnchor == 2) {
    P = vec2((0.5 * res.y - frag.y) / unit, frag.x / unit); extent = res.x / unit;
  } else if (uAnchor == 3) {
    P = vec2((frag.y - 0.5 * res.y) / unit, (res.x - frag.x) / unit); extent = res.x / unit;
  } else {
    P = vec2((frag.x - 0.5 * res.x) / unit, frag.y / unit); extent = res.y / unit;
  }
  float hz = max(uCoverage * extent, 0.05);
  vec2 Q = P / uScale;
  vec2 orb = vec2(1.0, 0.0) * uMotion * 0.55;
  vec2 orb2 = vec2(cos(2.1), sin(2.1)) * uMotion * 0.4;

  vec2 q = vec2(
    fbm(Q * 0.9 + uSeedOff + orb, 4),
    fbm(Q * 0.9 + uSeedOff.yx + vec2(5.2, 1.3) - orb, 4));
  vec2 r = vec2(
    fbm(Q * 1.7 + 1.6 * q + uSeedOff + vec2(1.7, 9.2) + orb2, 3),
    fbm(Q * 1.7 + 1.6 * q + uSeedOff + vec2(8.3, 2.8) - orb2, 3));
  vec2 W = P + uWarp * uScale * vec2(0.22, 0.12) * (r + 0.5 * q);
  float rag = fbm(Q * 5.0 + uSeedOff * 1.3 + r * 0.7, 5);
  float ragFine = gnoise(Q * 40.0 + uSeedOff + r * 3.0);
  float depth = W.y + uFeather * uScale * (rag * 0.07 + ragFine * 0.01);
  float turb = fbm(W * 1.2 / uScale + q * 0.3 + uSeedOff + vec2(4.4, 1.9) + orb * 0.4, 5);
  float slope = (hash12(uSeedOff * 0.73) - 0.5) * 1.1;
  float H = depth / hz + uRidge * (0.55 * turb + slope * W.x * 0.45 / hz);

  if (uRiver > 0.001) {
    float rBase = hz * mix(0.08, 0.8, uRiverDepth);
    float x = W.x;
    float e = 0.01;
    float yc = riverLine(x, rBase, hz, orb);
    float slopeR = (riverLine(x + e, rBase, hz, orb) - riverLine(x - e, rBase, hz, orb)) / (2.0 * e);
    float dist = (depth - yc) / sqrt(1.0 + slopeR * slopeR);
    float persp = clamp(1.0 - yc / hz, 0.0, 1.0);
    float width = uRiverWidth * uScale * mix(0.12, 1.05, persp);
    width *= 0.7 + 0.6 * smoothstep(-0.5, 0.5, gnoise(vec2(x * 2.2 / uScale, 9.1) + uSeedOff));
    float ad = abs(dist) + (rag * 0.025 + ragFine * 0.006) * uFeather * uScale + 0.4 * ragFine * width * 0.22;
    float fade = smoothstep(hz * 1.08, hz * 0.65, yc) * smoothstep(-0.05, 0.05, yc);
    // A wider bank than the generator's: the washes cut it a little crisper.
    float lift = (1.0 - smoothstep(width * 0.35, width * 1.15, ad)) * fade * uRiver;
    // The lifted current keeps a pale tint of pigment, like the generator's: just
    // inside the palest wash nearby, fading to haze in the distance.
    H = mix(H, max(H, 0.985 + 0.08 * (1.0 - persp)), clamp(lift, 0.0, 1.0));
  }
  o = vec4(clamp(pigmentOf(H), 0.0, 1.3), 0.0, 0.0, 0.0);
}
`;

/** Shared by the paper, flow and render passes: screen -> sheet mapping. */
const MAPPING = /* glsl */ `
uniform vec4 uMap;          // field texel = frag * uMap.xy + uMap.zw
uniform float uUnit;        // one sheet unit, in field texels
uniform vec2 uSeedOff;
`;

/**
 * Paper: everything that never moves, baked once per canvas size.
 *   r: edge grit   g: granulation   b: brush relief light   a: grain & cockling
 */
const COTTON_NOISE = /* glsl */ `
// V3: triangular simplex support, rather than a visible square fiber lattice.
float paperCorner(vec2 lattice, vec2 delta) {
  float falloff = max(0.5 - dot(delta, delta), 0.0);
  vec2 gradient = hash22(lattice) * 2.0 - 1.0;
  gradient *= inversesqrt(max(dot(gradient, gradient), 0.08));
  return falloff * falloff * falloff * falloff * dot(gradient, delta);
}
float paperNoise(vec2 p) {
  const float F2 = 0.3660254037844386;
  const float G2 = 0.2113248654051871;
  vec2 cell = floor(p + (p.x + p.y) * F2);
  vec2 a = p - cell + (cell.x + cell.y) * G2;
  vec2 corner = a.x > a.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec2 b = a - corner + G2;
  vec2 c = a - 1.0 + 2.0 * G2;
  return 70.0 * (paperCorner(cell, a) + paperCorner(cell + corner, b) + paperCorner(cell + 1.0, c));
}
// Analytic simplex gradients: derivatives of sampled relief inherit the GPU's
// 2x2 derivative quads and stamp a tiny embossed checkerboard onto the paper.
vec2 paperCornerGradient(vec2 lattice, vec2 delta) {
  float t = max(0.5-dot(delta,delta),0.0);
  vec2 g = hash22(lattice)*2.0-1.0;
  g *= inversesqrt(max(dot(g,g),0.08));
  return t*t*t*t*g-8.0*t*t*t*dot(g,delta)*delta;
}
vec2 paperNoiseGradient(vec2 p) {
  const float F2=0.3660254037844386,G2=0.2113248654051871;
  vec2 cell=floor(p+(p.x+p.y)*F2);
  vec2 a=p-cell+(cell.x+cell.y)*G2;
  vec2 corner=a.x>a.y?vec2(1,0):vec2(0,1);
  return 70.0*(paperCornerGradient(cell,a)
    +paperCornerGradient(cell+corner,a-corner+G2)
    +paperCornerGradient(cell+1.0,a-1.0+2.0*G2));
}
float cottonBandWeight(float footprint) {
  return 1.0-smoothstep(0.35,0.85,footprint);
}
float filteredPaperNoise(vec2 p) {
  return paperNoise(p)*cottonBandWeight(max(length(dFdx(p)),length(dFdy(p))));
}
float cottonFbm(vec2 p,int octaves) {
  float sum=0.0,weight=0.5;
  float footprint=max(length(dFdx(p)),length(dFdy(p)));
  for(int i=0;i<6;i++){
    if(i>=octaves)break;
    sum+=weight*cottonBandWeight(footprint)*paperNoise(p);
    p=ROT*p*2.03+vec2(13.7,8.1);footprint*=2.03;weight*=0.5;
  }
  return sum;
}
`;

export const PAPER = HEAD + NOISE + MAPPING + COTTON_NOISE + /* glsl */ `
uniform float uPx;
out vec4 o;

void main() {
  vec2 S = (gl_FragCoord.xy * uMap.xy + uMap.zw) / uUnit;
  vec2 P = S * 900.0;
  // Rotated supports remove horizontal/vertical repetition. No crossed fibers.
  const mat2 A = mat2(0.781, 0.625, -0.625, 0.781);
  const mat2 B = mat2(0.292, -0.956, 0.956, 0.292);
  vec2 seed = uSeedOff * 2.71;
  float footprint = max(length(dFdx(P)), length(dFdy(P)));
  float lowWeight=cottonBandWeight(footprint*0.23);
  float midWeight=cottonBandWeight(footprint*0.59);
  float fineWeight=cottonBandWeight(footprint*0.94);
  float pores = 0.65 * paperNoise(P * 0.23 + seed) * lowWeight
              + 0.35 * paperNoise(A * P * 0.59 + seed.yx + 8.3) * midWeight;
  float fine = paperNoise(B * P * 0.94 + seed + 27.0) * fineWeight;
  float body = paperNoise(A * P * 0.032 + seed * 0.21 + 5.0);
  float edge = 0.30 * pores + 0.17 * fine;

  // Mineral variation belongs mainly to the pigment, not to bare paper.
  float mineral = smoothstep(0.10, 0.70, pores * 0.75 + fine * 0.25);
  float gran = 0.050 * pores + 0.033 * mineral - 0.004;
  vec2 poresGradient=0.65*0.23*lowWeight*paperNoiseGradient(P*0.23+seed)
    +0.35*0.59*midWeight*transpose(A)*paperNoiseGradient(A*P*0.59+seed.yx+8.3);
  vec2 fineGradient=0.94*fineWeight*transpose(B)*paperNoiseGradient(B*P*0.94+seed+27.0);
  vec2 slope=0.50*poresGradient+0.10*fineGradient;
  vec3 normal = normalize(vec3(-slope * 0.22, 1.8));
  float light = dot(normal, vec3(-0.451, 0.551, 0.702)) - 0.702;
  float paper = 0.008 * pores + 0.004 * fine + 0.007 * body;
  o = vec4(edge * 0.5 + 0.5, (gran + 0.15) / 0.4,
           clamp(light * 0.5 + 0.6, 0.0, 1.0), paper * 4.0 + 0.5);
}
`;

/**
 * Flow: the slow, breathing noise fields, at a quarter of the resolution.
 *   0: breathing offset (field texels), rag, turbulence
 *   1: hue drift, mottling, mist, edge softness
 *   2: two pairs of noises the washes mix into their own edge wobble and load
 */
export const FLOW = HEAD + NOISE + MAPPING + /* glsl */ `
uniform float uTime;
uniform float uDrift;
layout(location = 0) out vec4 o0;
layout(location = 1) out vec4 o1;
layout(location = 2) out vec4 o2;
void main() {
  vec2 S = (gl_FragCoord.xy * uMap.xy + uMap.zw) / uUnit;
  float ang = uTime * TAU / 26.0;
  vec2 orb = vec2(cos(ang), sin(ang)) * uDrift * 0.55;
  vec2 orb2 = vec2(cos(ang + 2.1), sin(ang + 2.1)) * uDrift * 0.4;
  vec2 q = vec2(fbm(S * 0.9 + uSeedOff + orb, 3), fbm(S * 0.9 + uSeedOff.yx + vec2(5.2, 1.3) - orb, 3));
  vec2 r = vec2(
    fbm(S * 1.7 + 1.6 * q + uSeedOff + vec2(1.7, 9.2) + orb2, 3),
    fbm(S * 1.7 + 1.6 * q + uSeedOff + vec2(8.3, 2.8) - orb2, 3));
  vec2 warp = uDrift * vec2(0.016, 0.012) * (r + 0.5 * q) * uUnit;
  float rag = fbm(S * 5.0 + uSeedOff * 1.3 + r * 0.7, 4);
  float turb = fbm(S * 1.2 + q * 0.3 + uSeedOff + vec2(4.4, 1.9) + orb * 0.4, 4);
  o0 = vec4(warp, rag, turb);

  float driftN = fbm(S * 0.7 + q * 0.45 + uSeedOff + vec2(3.1, 7.7) + orb * 0.7, 3);
  float mottle = fbm(S * 14.0 + r * 2.0 + uSeedOff * 0.7 + orb * 0.3, 3);
  float mistN = fbm(vec2(S.x * 1.6, S.y * 3.6) + uSeedOff + orb * 0.6 + r * 0.5, 3);
  float softN = fbm(S * 1.3 + uSeedOff + vec2(11.0, 4.0), 2);
  o1 = vec4(driftN, mottle, mistN, softN);

  o2 = vec4(
    gnoise(S * 1.8 + uSeedOff + vec2(5.3, 3.7) + orb * 0.35),
    gnoise(S * 2.6 + uSeedOff + vec2(1.1, 8.4) - orb * 0.4),
    fbm(S * 2.0 + uSeedOff + vec2(11.0, 2.0) + orb * 0.5, 2),
    fbm(S * 2.3 + uSeedOff + vec2(3.0, 13.0) - orb * 0.5, 2));
}
`;

/** HAÏKUARELLE: reusable RGBA alpha atlas. R = broad wash density, G = broken
 * backrun rims, B = diluted bloom interiors, A = mineral sediment pockets.
 * The same warped scalar field defines a pale bloom and its dark rim, so the
 * marks have a common structure rather than being unrelated uniform noise.
 * Grain/fibres still come from the full-resolution paper texture.
 */
export const DRYING_MASKS = HEAD + NOISE + MAPPING + COTTON_NOISE + /* glsl */ `
out vec4 o;
void main() {
  vec2 P = (gl_FragCoord.xy * uMap.xy + uMap.zw) / uUnit;
  vec2 seed = uSeedOff * 0.73;
  vec2 warp = vec2(cottonFbm(P * 3.4 + seed, 3), cottonFbm(ROT * P * 4.1 + seed.yx + 13.2, 3));
  float wash = cottonFbm(P * 4.8 + warp * 1.9 + seed, 4);
  float bloom = cottonFbm(P * 15.0 + warp * 3.2 + seed.yx + 9.7, 4);
  float edge = 0.065 + 0.035 * paperNoise(P * 5.3 + seed + 19.0);
  float pale = smoothstep(edge, edge + 0.15, bloom);
  float arcs = exp(-abs(bloom - edge) / 0.022);
  arcs *= 0.3 + 0.7 * smoothstep(-0.22, 0.24, cottonFbm(P * 29.0 + warp + seed, 2));
  // Fine mineral islands follow the same warped wash, not independent speckle.
  float sediment = cottonFbm(P * 43.0 + warp * 4.7 + seed + 37.1, 3)
                 + 0.16 * filteredPaperNoise(P * 137.0 + warp * 6.0 + seed.yx);
  float pockets = smoothstep(0.015, 0.28, sediment);
  float activity = smoothstep(-0.06, 0.18, cottonFbm(P * 3.3 + warp * 0.5 + seed + 47.5, 3));
  o = vec4(smoothstep(-0.32, 0.32, wash), clamp(arcs * activity, 0.0, 1.0), pale * activity, pockets * (0.3 + 0.7 * activity));
}
`;

/**
 * The look: the generator's wash stack, fed by the painted field instead of
 * procedural noise. Bare paper stays bare; edges are as soft as the generator's
 * (softer still while wet) and pool into darker rims as they dry.
 */
export const RENDER = HEAD + MAPPING + HEIGHT + /* glsl */ `
uniform sampler2D uField;
uniform sampler2D uPaperTex;
uniform sampler2D uFlow0;
uniform sampler2D uFlow1;
uniform sampler2D uFlow2;
uniform sampler2D uDryingTex;
uniform vec2 uFieldSize;
uniform vec2 uRes;
uniform vec3 uPaper;        // linear rgb
uniform vec3 uLab[15];      // three inks, each five OKLab colors, deepest -> palest
uniform float uOptical;
uniform int uLayers;
uniform float uEdge, uTexture, uHueDrift, uMist, uRidge, uFeather, uDensity, uDetail, uDryingDetail, uDrySharpness, uDryThreshold;
out vec4 fragColor;

vec3 oklabToLinear(vec3 c) {
  float l = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  l = l * l * l; m = m * m * m; s = s * s * s;
  return vec3(
     4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
}

// This pixel's share of each ink (set once per pixel in main).
vec3 inkShare = vec3(1.0, 0.0, 0.0);

// x in 0..4 along the ramps (0 = deepest), the inks mixed in OKLab by their shares.
vec3 pigment(float x) {
  if(uOptical>0.5)return uPaper*exp(-8.0*inkShare*max(0.0,(4.4-x)/3.25));
  x = clamp(x, 0.0, 4.0);
  int a = int(min(floor(x), 3.0));
  float f = x - float(a);
  f = f * f * (3.0 - 2.0 * f);
  // HAÏKUARELLE: approximate subtractive mixing in optical density.
  // This is a reflectance approximation, not a spectral pigment model.
  vec3 c0 = max(oklabToLinear(mix(uLab[a], uLab[a + 1], f)), vec3(0.003));
  vec3 c1 = max(oklabToLinear(mix(uLab[a + 5], uLab[a + 6], f)), vec3(0.003));
  vec3 c2 = max(oklabToLinear(mix(uLab[a + 10], uLab[a + 11], f)), vec3(0.003));
  return exp(inkShare.x * log(c0) + inkShare.y * log(c1) + inkShare.z * log(c2));
}

vec3 toSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec4 pigmentField(vec2 p);
float hAt(vec2 t) { return heightOf(pigmentField(t).x); }

// Positive cubic reconstruction when magnified: continuous rounded support,
// no nearest-cell clamp terraces, negative ringing or invented pigment peaks.
vec4 pigmentField(vec2 p) {
  if (uDetail < 0.5 || min(uMap.x, uMap.y) >= 0.95) return texture(uField, p / uFieldSize);
  vec2 cell=floor(p-0.5),f=fract(p-0.5),v=1.0-f;
  vec2 w0=v*v*v/6.0,w1=(3.0*f*f*f-6.0*f*f+4.0)/6.0;
  vec2 w2=(-3.0*f*f*f+3.0*f*f+3.0*f+1.0)/6.0,w3=f*f*f/6.0;
  vec2 g0=w0+w1,g1=w2+w3;
  vec2 a=(cell-0.5+w1/g0)/uFieldSize,b=(cell+1.5+w3/g1)/uFieldSize;
  return texture(uField,a)*g0.x*g0.y + texture(uField,vec2(b.x,a.y))*g1.x*g0.y
    +texture(uField,vec2(a.x,b.y))*g0.x*g1.y + texture(uField,b)*g1.x*g1.y;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 suv = frag / uRes;
  vec4 paperT = texelFetch(uPaperTex, ivec2(frag), 0);
  vec4 f0 = texture(uFlow0, suv);
  vec2 ft = frag * uMap.xy + uMap.zw;
  vec2 at = ft + f0.xy;

  vec4 fv = pigmentField(at);
  float pv = fv.x;
  float wet = fv.y;
  vec2 other = pv > 1e-4 ? clamp(fv.zw / pv, 0.0, 1.0) : vec2(0.0);
  inkShare = vec3(max(1.0 - other.x - other.y, 0.0), other);

  float edgeN = paperT.r * 2.0 - 1.0;
  vec3 col = uPaper;
  float pig = 0.0;

  if (pv > 1e-4) {
    vec4 f1 = texture(uFlow1, suv);
    vec4 f2 = texture(uFlow2, suv);
    float rag = f0.z;
    float turb = f0.w;
    float driftN = f1.x;
    float paperLum = dot(uPaper, vec3(0.2126, 0.7152, 0.0722));
    // Organic wobble on the slopes only: bare paper stays bare, solid cores stay solid.
    float body = clamp(pv * (1.25 - pv) * 3.2, 0.0, 1.0);
    float H = heightOf(pv) + (uRidge * 0.1 * turb + uFeather * 0.035 * rag) * body;
    // How fast the height changes, per sheet unit (the generator's is about 1.8).
    vec4 neighbours = vec4(pigmentField(at+vec2(1.0,0.0)).r,
      pigmentField(at-vec2(1.0,0.0)).r,
      pigmentField(at+vec2(0.0,1.0)).r,
      pigmentField(at-vec2(0.0,1.0)).r);
    vec2 g = vec2(heightOf(neighbours.x)-heightOf(neighbours.y),
                  heightOf(neighbours.z)-heightOf(neighbours.w)) * 0.5 * uUnit;
    float slope = length(g);
    float gH = max(slope, 1.6);
    // Softness is the generator's, measured in height, scaled by how steeply the
    // pigment falls toward each wash's own edge (looked at a few texels out). A
    // steep bank melts the washes it cuts through instead of leaving a rim of each
    // one's color, while a flat wash beside it stays whole, and flat pigment (which
    // the generator never has) stays crisp instead of dissolving into grain.
    float H0 = heightOf(pv);
    vec2 dir = slope > 1e-3 ? g / slope : vec2(0.0);
    float slopeUp = max(hAt(at + dir * 4.0) - H0, 0.0) * uUnit / 4.0;
    float slopeDown = max(H0 - hAt(at - dir * 4.0), 0.0) * uUnit / 4.0;
    // Crisp edges catch on the paper's tooth, a pixel or two either way.
    float tooth = edgeN * 0.0025 * min(slope, 40.0);
    float dry = 1.0 - smoothstep(0.0, 0.5, wet);

    int L = uLayers;
    float denom = float(max(L - 1, 1));
    for (int i = 0; i < 7; i++) {
      if (i >= L) break;
      float fl = float(i);
      float fi = fl / denom;
      float ph = fl * 2.4;
      float thr = mix(1.0, 0.14, pow(fi, 0.85));
      float own = f2.x * cos(ph) + f2.y * sin(ph);
      float dH = thr + 0.03 * own * body - H;

      float soft = mix(0.029, 0.008, fi) * (0.4 + 1.2 * uMist * (1.0 - fi));
      soft *= mix(0.4, 2.0, smoothstep(-0.45, 0.45, f1.w + 0.35 * sin(fl * 2.3)));
      soft *= 1.0 + wet;
      soft *= mix(1.0, 0.36, uDetail);
      float toward = min(slope, mix(slopeDown, slopeUp, smoothstep(-0.03, 0.03, thr - H)));
      float sH = max(min(soft * clamp(toward, 0.35, 8.0), 0.11), fwidth(dH) * 0.65);
      float m = smoothstep(-sH, sH, dH + sH * 0.9 * edgeN + tooth);
      if (m <= 0.0) continue;
      float inside = dH / gH;

      float wash = 0.82 + 0.28 * (f2.z * cos(ph * 1.3 + 1.0) + f2.w * sin(ph * 1.3 + 1.0));
      // Pigment pools along the rim, measured in height like the generator's, so a
      // steep edge (a lifted current, a stroke) gets a hairline, not a dark band.
      float pool = uEdge * dry * exp(-max(dH, 0.0) / (0.022 + 0.5 * sH)) * min(1.0, 3.0 / gH);
      float a = clamp(m * (wash * mix(0.7, 1.15, fi) * uDensity + 0.4 * pool), 0.0, 1.0);

      float idx = mix(clamp(H, 0.0, 1.1) * 3.8, (1.0 - fi) * 3.6 + 0.2, 0.18);
      idx += uHueDrift * driftN * 3.4;
      idx -= clamp(inside * 1.5, 0.0, 0.6);
      vec3 lc = pigment(idx);
      lc = mix(lc, pigment(idx - 1.2) * 0.85, clamp(pool * 0.7, 0.0, 0.7));

      vec3 glaze = col * lc / max(uPaper, vec3(0.03));
      vec3 paint = mix(lc, glaze, 0.28 * paperLum);
      col = mix(col, paint, a);
      pig = pig + a * (1.0 - pig);
    }

    col *= 1.0 - pig * (0.28 * rag + 0.24 * f1.y);

    // Mist, as in the generator: a granular haze where the palest wash dissolves
    // into paper, and a veil over the far washes.
    float mistN = f1.z;
    float mistBand = 1.0 - smoothstep(-0.05, 0.06 + 0.3 * uMist, H - 1.0 + mistN * 0.12);
    float wisp = smoothstep(-0.25, 0.55, mistN + 0.2) * (0.75 + 0.5 * edgeN);
    vec3 mistCol = mix(uPaper, pigment(3.5 + uHueDrift * driftN * 1.5), 0.55);
    col = mix(col, mistCol, clamp(mistBand * wisp * uMist * 0.6 * (1.0 - pig), 0.0, 1.0));
    float veil = smoothstep(0.5, 1.02, H) * wisp;
    col = mix(col, mistCol, clamp(veil * uMist * 0.28 * pig, 0.0, 1.0));

    // Wet paint reads a little deeper.
    col *= 1.0 - 0.08 * wet * pig;
    if (uDetail > 0.5) {
      // HAÏKUARELLE: continuous optical concentration for a real wet-on-wet
      // wash, instead of visible quantization into the generator's six terraces.
      // The upstream transported pigment, paper relief and ink shares remain
      // the source. Absorption is an approximation, not a spectral simulation.
      float mineral = (paperT.g * 0.4 - 0.15) * 5.0;
      float mottling = 0.88 + 0.36 * rag + 0.22 * f1.y;
      float concentration = max(0.0, pv * mottling * (1.0 + uTexture * mineral * (0.25 + 0.75 * (1.0 - clamp(pv, 0.0, 1.0)))));
      // Sharpen transported pigment only as it dries. Reuse the four gradient
      // samples; bounded local contrast cannot add paint outside the field.
      float crisp = uDrySharpness * uDryingDetail * (1.0-smoothstep(0.015,0.28,wet));
      float localDetail = pv-dot(neighbours,vec4(0.25));
      concentration += crisp*0.28*clamp(localDetail,-0.12*pv,0.30*pv);
      // A narrow broken tide mark, derived from the actual concentration slope.
      float rim = exp(-abs(pv - 0.065) / 0.018) * dry * min(slope * 0.12, 0.85);
      concentration += rim * (0.045 + 0.035 * edgeN) * uEdge;
      if (uDryingDetail > 0.0) {
        vec4 alpha = texture(uDryingTex, suv);
        float reveal = (1.0 - smoothstep(0.015, 0.30, wet)) * uDryingDetail;
        float material = reveal * (0.45 + 0.55 * uTexture);
        // A soft threshold selects coherent sediment pockets instead of laying
        // uniform noise over the wash. Threshold and sharpness are independent:
        // the first selects deposits, the second defines their edges/contrast.
        float threshold = mix(0.16,0.70,uDryThreshold);
        float pockets = smoothstep(threshold-0.12,threshold+0.12,alpha.a);
        alpha.a = mix(alpha.a,pockets,reveal*min(4.0*uDryThreshold,1.0));
        alpha.r = mix(alpha.r,smoothstep(0.19,0.81,alpha.r),crisp*0.6);
        alpha.g = mix(alpha.g,smoothstep(0.04,0.45,alpha.g),crisp*0.68);
        // Same pigment, different optical thickness: transparent lakes beside
        // denser islands. These masks never draw on unpainted paper.
        concentration *= mix(1.0, 0.88 + 0.24 * alpha.r + 0.12 * alpha.a, material);
        concentration *= 1.0 - material * alpha.b * 0.16;
        concentration += material * alpha.g * (0.012 + (0.065+0.055*crisp) * min(pv, 0.5));
        // Full-resolution paper tooth catches the selected mineral deposits.
        float sedimentRelief = alpha.a * (0.48 + 0.28 * alpha.r);
        concentration *= 1.0+crisp*uTexture*sedimentRelief*0.24*clamp(mineral,-0.7,0.9);
        // Coffee-ring deposit follows the REAL outer pigment boundary. A
        // second, interrupted inner rim suggests receding water, not a contour
        // pasted around every procedural mask. Width is in paper units.
        float inset = max(0.0, (heightOf(0.028) - H0) / max(slope, 1.0));
        float width = (0.0009 + 0.0028 * alpha.a + 0.0012 * alpha.b) * (1.0-0.22*crisp);
        float broken = 0.22 + 0.78 * smoothstep(0.18,0.78,alpha.r);
        float outer = exp(-inset / width) * smoothstep(0.8, 7.0, slope);
        // Offset and softness vary together with the coherent drying masks:
        // narrow dark rims, broad backruns and interrupted secondary rings.
        float innerOffset = width * (2.0 + 3.2 * alpha.b);
        float inner = exp(-abs(inset - innerOffset) / (width * (0.45 + 0.65 * alpha.a)));
        inner *= smoothstep(0.35, 0.75, alpha.r) * smoothstep(1.0, 6.0, slope);
        float paleBand = exp(-abs(inset - innerOffset * 0.65) / max(width,0.0001));
        concentration *= 1.0 - reveal * paleBand * alpha.b * 0.18;
        concentration += reveal * uEdge * broken * ((0.19+0.11*crisp) * outer + (0.025+0.025*crisp) * inner);
      }
      vec3 reflectance = clamp(pigment(1.15) / max(uPaper, vec3(0.03)), vec3(0.003), vec3(1.0));
      col = uPaper * pow(reflectance, vec3(concentration * 1.55));
      float edgeAA = max(fwidth(pv) * mix(0.8,0.48,crisp), mix(0.0015,0.0007,crisp));
      float boundary = smoothstep(0.028 - edgeAA, 0.028 + edgeAA, pv + edgeN * 0.006);
      col = mix(uPaper, col, boundary);
      pig = 1.0 - exp(-concentration * 4.0);
      col *= 1.0 - 0.035 * wet * pig;
    }
  }

  float gran = paperT.g * 0.4 - 0.15;
  float light = (paperT.b - 0.6) * 2.0;
  float grain = (paperT.a - 0.5) * 0.25;
  float tooth = pig * (0.6 + 0.8 * (1.0 - pig));
  // Clear water on cotton is visible before pigment arrives. This comes from the
  // actual wetness channel and evaporates with it; it is never baked into paper.
  float damp = smoothstep(0.008, 0.28, wet) * uDetail;
  col *= 1.0 - damp * 0.22 * (1.0 - pig * 0.82);
  col += vec3(0.002, 0.005, 0.008) * damp * (0.5 + 0.5 * paperT.b) * (1.0 - pig);
  // Correlate mineral pigment density with the depressions in the paper.
  col *= 1.0 - mix(1.40, 1.8, uDetail) * uTexture * tooth * gran;
  col *= 1.0 + mix(0.35,0.035,uDetail) * uTexture * mix(0.06,0.65,pig) * light;
  col *= 1.0 + 0.65 * uTexture * grain;

  vec3 outc = toSrgb(col) + (hash12(frag) - 0.5) / 255.0;
  fragColor = vec4(outc, 1.0);
}
`;
