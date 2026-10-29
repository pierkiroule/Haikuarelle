import { hexToLinear, linearToSrgb, rgbToHex, type RGB } from '../vendor/pigment-drift/engine/color';
export interface Palette { id: string; name: string; note: string; colors: [string,string,string]; paper: string }
export const PALETTES: Palette[] = [
  {id:'estuaire',name:'Estuaire',note:'Indigo · terre de Sienne',colors:['#254e62','#b18047','#687d78'],paper:'#f5f2e9'},
  {id:'lichen',name:'Lichen',note:'Vert de vessie · terre dorée',colors:['#435d51','#aaa269','#657e79'],paper:'#f4f1e6'},
  {id:'argile',name:'Argile',note:'Oxyde rouge · rose de terre',colors:['#9c4e3a','#b78177','#615a65'],paper:'#f7f0e6'},
  {id:'brume',name:'Brume',note:'Outremer · gris de Payne',colors:['#485d8b','#7c8799','#887c9b'],paper:'#f3f1ec'},
  {id:'ambre',name:'Ambre',note:'Ocre jaune · terre brûlée',colors:['#b38332','#805039','#576262'],paper:'#f6f0e3'},
];
/** Shared channels keep each bird's pigments stable when a different pad plays. */
export const PLUMAGE_PALETTE:Palette={id:'plumages',name:'Plumages',note:'Carbone · orange de gorge · bleu de geai',colors:['#202627','#cf5930','#3d83b8'],paper:'#ffffff'};
/** Stable indices shared by every bird. Choosing a brush never changes this table. */
export const PLUMAGE_PIGMENTS=[
  '#202627', // 0 carbon
  '#cf5930', // 1 robin orange
  '#3d83b8', // 2 jay blue
  '#247ab8', // 3 blue tit cerulean
  '#e1c54a', // 4 soft lemon yellow
  '#d95e79', // 5 bullfinch rose
  '#939a9d', // 6 pearl grey
  '#6f879a', // 7 blue slate
  '#cb8646', // 8 russet ochre
  '#708b43', // 9 moss green
  '#bf4149', // 10 carmine accent
];
export function getPalette(id: string): Palette {return id===PLUMAGE_PALETTE.id?PLUMAGE_PALETTE:PALETTES.find(p=>p.id===id) ?? PALETTES[0];}
/** A single pigment's transparent concentration ramp. Never a rainbow ramp. */
export function inkRamp(hex: string, paper: string): string[] {
  const c=hexToLinear(hex), p=hexToLinear(paper);
  return [1.20,0.96,0.68,0.34,0.07].map(concentration=>rgbToHex(c.map((v,i)=>{
    const transmittance=Math.max(0.005,v/Math.max(p[i],0.005));
    return linearToSrgb(p[i]*Math.pow(transmittance,concentration));
  }) as RGB));
}
