/** Artistic colour-family responses, not measured chemical pigment identities.
 * The RGB optical basis survives mixing; no extra simulation field is required.
 * x granulation, y wet mobility, z staining, w dark neutral deposition.
 */
export const MATERIAL_RESPONSE=`
vec4 pigmentResponse(vec3 reflectance){
 float blue=smoothstep(.04,.45,reflectance.b-max(reflectance.r,reflectance.g));
 float yellow=smoothstep(.05,.45,min(reflectance.r,reflectance.g)-reflectance.b);
 float red=smoothstep(.05,.45,reflectance.r-max(reflectance.g,reflectance.b));
 float neutral=1.-smoothstep(.03,.20,max(reflectance.r,max(reflectance.g,reflectance.b))-min(reflectance.r,min(reflectance.g,reflectance.b)));
 float dark=neutral*(1.-smoothstep(.08,.35,max(reflectance.r,max(reflectance.g,reflectance.b))));
 return vec4(clamp(.52+.36*blue-.22*yellow+.22*dark,.22,.95),clamp(.86-.24*blue+.12*yellow-.28*dark,.4,1.),clamp(.5+.32*red+.18*yellow-.25*blue,.18,.92),dark);
}
`;
