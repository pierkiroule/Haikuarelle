/** Bound GPU work by screen area; texture detail is independent of mesh density. */
export function voyageQuality(coarse:boolean,cores=4,memory=4){
  const constrained=cores<=4||memory<=2;
  return {textureSize:coarse?(constrained?2048:2560):(constrained?2048:3072),
    resolution:coarse?(constrained?224:288):384,pixelBudget:coarse?2000000:3600000,maxDpr:coarse?1.75:2};
}
export function renderPixelRatio(width:number,height:number,dpr:number,budget:number,cap:number){
  return Math.min(Math.max(1,dpr),cap,Math.sqrt(budget/Math.max(1,width*height)));
}
export function currentVoyageQuality(){
  const memory=(navigator as Navigator&{deviceMemory?:number}).deviceMemory??4;
  return voyageQuality(matchMedia('(pointer: coarse)').matches,navigator.hardwareConcurrency||4,memory);
}
