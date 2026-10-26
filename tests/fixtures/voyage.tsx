/** Browser QA only: deliberately exercises the production voyage component. */
import {createRoot} from 'react-dom/client';
import VoyageDialog,{type Journey} from '../../src/voyage/VoyageDialog';
declare global {interface Window {
  __mountVoyage:(journey:Journey,onClose:()=>void)=>void;
  __closeVoyage:()=>void;
}}
const root=createRoot(document.querySelector('#root')!);
window.__mountVoyage=(journey,onClose)=>root.render(<VoyageDialog journey={journey} onClose={onClose}/>);
window.__closeVoyage=()=>root.render(null);
