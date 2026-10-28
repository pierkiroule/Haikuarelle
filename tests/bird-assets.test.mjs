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

it('ships a credited, hash-verified sample for every selectable feather, with no duplicate selection',async()=>{
 const {BIRD_BRUSHES}=await import('../src/birds/catalog');
 const rows=JSON.parse(readFileSync(new URL('../public/birds/credits.json',import.meta.url),'utf8'));
 expect(BIRD_BRUSHES).toHaveLength(12);
 for(const bird of BIRD_BRUSHES){
  const row=rows.find(r=>r.id===bird.id),audio=readFileSync(new URL(`../public/birds/${bird.id}.mp3`,import.meta.url));
  expect(row.source).toBe(bird.source);expect(row.author).toContain(bird.author.split(' · ')[0]);expect(row.pad_active).toBe(true);expect(row.sha256).toBe(createHash('sha256').update(audio).digest('hex'));
  expect(['CC0-1.0','CC-BY-SA-3.0','CC-BY-SA-4.0']).toContain(row.license);expect(audio.length).toBeGreaterThan(1000);
 }
 expect(new Set(BIRD_BRUSHES.map(b=>b.id)).size).toBe(12);
});
