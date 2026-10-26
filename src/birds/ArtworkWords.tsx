import {APP_NAME} from '../brand';
import type {ArtworkPoetry} from './artworkPoetry';

export function ArtworkTitle({poetry}:{poetry:ArtworkPoetry}){
  return <header className="artwork-title" aria-live="polite"><span>{APP_NAME}</span><h2>{poetry.title}</h2></header>;
}
export function ArtworkPoem({poetry,dedication=''}:{poetry:ArtworkPoetry;dedication?:string}){
  return <section className="bird-poem artwork-poem has-poem" aria-label="Le haïku de votre œuvre" aria-live="polite"><span className="poem-mark">•°</span><p className="poem-lines">{poetry.verses.map((line,i)=><span key={i} style={{'--line':i} as React.CSSProperties}>{line}</span>)}</p>{dedication.trim()&&<small>Pour {dedication.trim()}</small>}</section>;
}
