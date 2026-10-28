import {it,expect} from 'vitest';
import {echoPhrases} from '../src/dance/soundtrack';
it('plays a complete sample once, three quieter echoes, then leaves silence',()=>{
 for(const duration of [.5,3,6,15,20]){const phrases=echoPhrases(duration);expect(phrases).toHaveLength(4);expect(phrases[0].duration).toBe(duration);expect(phrases.map(p=>p.level)).toEqual([.7,.29,.14,.055]);expect(phrases.at(-1)!.start+phrases.at(-1)!.duration).toBeLessThanOrEqual(27);for(let i=1;i<4;i++)expect(phrases[i].start).toBeGreaterThan(phrases[i-1].start+phrases[i-1].duration);}
});
