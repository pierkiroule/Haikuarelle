"""Regenerate the public audio credits from the checked-in recording register."""
import json,html,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
rows=json.loads((root/'public/birds/credits.json').read_text())
names={'rougegorge':'Rouge-gorge','merle':'Merle noir','geai':'Geai','corneille':'Corneille','mesange':'Mésange bleue','bouvreuil':'Bouvreuil','sittelle':'Sittelle','picvert':'Pic vert','pie':'Pie','moineau':'Moineau domestique'}
def esc(v):return html.escape(str(v),quote=True)
def license_url(r):
 if r.get('license_url'):return r['license_url']
 return 'https://creativecommons.org/publicdomain/zero/1.0/' if r['license']=='CC0-1.0' else 'https://creativecommons.org/licenses/'+r['license'].lower().removeprefix('cc-').replace('-3.0','/3.0').replace('-4.0','/4.0')+'/'
def table(items):
 out='<section><table><tr><th>Oiseau</th><th>Prise de son</th><th>Source</th><th>Licence</th></tr>'
 for r in items:
  out+=f'<tr><td>{esc(names.get(r["id"],r["id"]))}</td><td>{esc(r["author"])}</td><td><a href="{esc(r["source"])}">Original</a></td><td><a href="{esc(license_url(r))}">{esc(r["license"])}</a></td></tr>'
  if r.get('modifications'):out+=f'<tr><td colspan="4"><small>{esc(r["modifications"])}</small></td></tr>'
  if r.get('source_copy_url'):out+=f'<tr><td colspan="4"><small><a href="{esc(r["source_copy_url"])}">Copie source utilisée</a></small></td></tr>'
 return out+'</table></section>'
active=[r for r in rows if r.get('pad_active')]
out='''<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Chants et crédits — Plume d’Haïkuarelle</title><style>body{background:#f3efe7;color:#685640;font:14px/1.7 Arial,sans-serif;max-width:960px;padding:24px;margin:auto}h1{font:32px Georgia,serif}a{color:#526b4d}table{border-collapse:collapse;width:100%}td,th{padding:10px;text-align:left;border-bottom:1px solid #d7decd}section{overflow:auto}small{font-size:11px}summary{cursor:pointer;padding:16px 0}</style><a href="/">← L’atelier</a>'''
out+=f'<h1>{len(active)} plumes, des chants et des couleurs.</h1><p>Enregistrements réels conservés localement. Les extraits et leurs adaptations restent sous les licences indiquées. Les sources, copies et empreintes sont détaillées dans <a href="credits.json">le registre des crédits</a>.</p>'
out+=table(active)+'<details><summary>Enregistrements historiques conservés</summary>'+table([r for r in rows if not r.get('pad_active')])+'</details><p><small>Pigment Drift — © 2026 ossianravn and contributors. <a href="/PIGMENT-DRIFT-LICENSE.txt">Licence MIT</a>. Typographie de l’œuvre : Caveat, <a href="/fonts/Caveat-LICENSE.txt">licence SIL Open Font License 1.1</a>.</small></p></html>'
(root/'public/birds/credits.html').write_text(out)
