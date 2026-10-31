export const APP_NAME="Haïkuarelle";
export const ARTIST_NAME="Pierre-Henri Garnier";
export const PROJECT_CREDIT="projet vibecodé avec IA";
/** Public atelier linked in the project README; never promote a localhost preview. */
export const APP_URL='https://haikuarelle-atelier-v1.pluckyslug4.chatgpt.site';
export function publicSiteAddress(href:string){
 const url=new URL(href),local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 const site=local?new URL(APP_URL):url;
 return site.host+site.pathname.replace(/\/$/,'');
}
