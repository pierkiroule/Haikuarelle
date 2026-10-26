import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {PIE} from '../src/birds/catalog';
it('ships the real magpie recording with matching local credits and licence',()=>{
  const rows=JSON.parse(readFileSync(new URL('../public/birds/credits.json',import.meta.url),'utf8'));
  const credit=rows.find(row=>row.id==='pie');
  const audio=readFileSync(new URL('../public/birds/pie.mp3',import.meta.url));
  expect(credit.source).toBe(PIE.source);expect(credit.author).toBe(PIE.author);
  expect(credit.recording_type).toBe('field-recording');expect(credit.species).toBe('Pica pica');
  expect(credit.source).toBe('https://freesound.org/people/naturenotesuk/sounds/555096/');
  expect(createHash('sha256').update(audio).digest('hex')).toBe(credit.sha256);
  expect(audio.length).toBe(credit.bytes);expect(credit.duration).toBeGreaterThan(.15);
  expect(credit.source_copy_url).toContain('ec4875a35d265b5431e3ba81fef6cc0ca0281bfc');
  expect(credit.license).toBe('CC0-1.0');
  expect(readFileSync(new URL('../public'+credit.license_copy,import.meta.url),'utf8')).toContain('CC0 1.0 Universal');
});
