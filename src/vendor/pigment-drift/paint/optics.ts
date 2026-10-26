import {hexToLinear} from '../engine/color';

/** HAÏKUARELLE: an RGB optical-density basis, not a spectral pigment model.
 * The existing R/BA pigment field carries total absorption and the green/blue
 * shares; red is the remainder. All colours therefore use the SAME upstream
 * advection, diffusion, bloom and drying, without an extra simulation texture.
 * Eight is the common unit used by FIELD_STEP and RENDER. Never change the
 * basis when a pad changes: old paint must keep its deposited coefficients.
 */
export const OPTICAL_UNIT=8;
export const MAX_PIGMENTS=16;
export function absorptionTable(pigments:readonly string[],paper:string):number[]{
  if(!pigments.length||pigments.length>MAX_PIGMENTS)throw new RangeError('One to sixteen optical pigments are supported.');
  const white=hexToLinear(paper);
  return Array.from({length:MAX_PIGMENTS},(_,i)=>hexToLinear(pigments[i]??pigments[0])
    .map((v,c)=>-Math.log(Math.max(.003,Math.min(1,v/Math.max(.003,white[c]))))/OPTICAL_UNIT)).flat();
}
