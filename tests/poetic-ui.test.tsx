// @vitest-environment jsdom
import {act} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {FloatingDock} from '../src/ui/FloatingDock';
import {TextGenerateEffect} from '../src/ui/TextGenerateEffect';
let host:HTMLDivElement,root:Root,reduced=false;
beforeEach(()=>{
 vi.useFakeTimers();vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT',true);vi.stubGlobal('requestAnimationFrame',()=>1);vi.stubGlobal('cancelAnimationFrame',()=>{});
 vi.stubGlobal('matchMedia',(query:string)=>({matches:query.includes('reduced-motion')&&reduced,addEventListener(){},removeEventListener(){}}));
 host=document.createElement('div');document.body.append(host);root=createRoot(host);reduced=false;
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();vi.useRealTimers();});
it('rests after inactivity and restores the original buttons through a keyboard-accessible handle',async()=>{
 const action=vi.fn();await act(async()=>root.render(<FloatingDock className="palette"><button onClick={action}>Eau</button></FloatingDock>));
 await act(async()=>vi.advanceTimersByTime(4300));expect(host.querySelector('[data-dock-visible]')?.getAttribute('data-dock-visible')).toBe('false');
 const handle=host.querySelector<HTMLButtonElement>('[aria-label="Afficher les outils de peinture"]')!;
 expect(handle.tabIndex).toBe(0);await act(async()=>handle.click());expect(host.querySelector('[data-dock-visible]')?.getAttribute('data-dock-visible')).toBe('true');
 const tool=host.querySelector<HTMLButtonElement>('.palette button')!;expect(document.activeElement).toBe(tool);await act(async()=>tool.click());expect(action).toHaveBeenCalledOnce();
});
it('keeps a keyboard-focused control visible, then fades only after focus leaves during painting',async()=>{
 await act(async()=>root.render(<FloatingDock className="palette" drawing><button>Eau</button></FloatingDock>));
 const tool=host.querySelector<HTMLButtonElement>('.palette button')!;await act(async()=>tool.focus());expect(host.querySelector('[data-dock-visible]')?.getAttribute('data-dock-visible')).toBe('true');
 await act(async()=>tool.blur());expect(host.querySelector('[data-dock-visible]')?.getAttribute('data-dock-visible')).toBe('false');
});
it('respects reduced motion and preserves every character of the poem',async()=>{
 reduced=true;const text='L’eau — un chant, puis le silence.';
 await act(async()=>root.render(<><FloatingDock className="palette" drawing><button>Eau</button></FloatingDock><TextGenerateEffect text={text}/></>));
 await act(async()=>vi.advanceTimersByTime(5000));expect(host.querySelector('[data-dock-visible]')?.getAttribute('data-dock-visible')).toBe('true');
 expect(host.querySelector('.poetic-text')?.textContent).toBe(text);expect([...host.querySelectorAll<HTMLElement>('.poetic-word')].every(word=>word.style.opacity!=='0')).toBe(true);
});
