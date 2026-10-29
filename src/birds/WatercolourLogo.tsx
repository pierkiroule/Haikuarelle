import {FeatherGlyph} from './FeatherGlyph';
/** Transform-only motion: no animated SVG filters or canvas on the welcome page. */
export function WatercolourLogo(){
 return <div className="welcome-emblem" aria-hidden="true">
  <span className="emblem-wash wash-blue"/><span className="emblem-wash wash-gold"/>
  <FeatherGlyph className="emblem-feather"/>
  <span className="emblem-drop drop-one"/><span className="emblem-drop drop-two"/><span className="emblem-drop drop-three"/>
 </div>;
}
