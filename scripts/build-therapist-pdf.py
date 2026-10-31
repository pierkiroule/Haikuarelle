"""Build the illustrated local PDF from the user's canonical Markdown (Python Playwright)."""
from pathlib import Path
import html,re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'docs/guide-therapeute.md').read_text().replace('\\.','.')
sections={};current='Introduction'
for block in re.split(r'\n\s*\n',source.strip())[2:]:
 if block.startswith('### '):current=block[4:];sections[current]=[]
 else:sections.setdefault(current,[]).append(block)
keys=list(sections)
paths={
 'leaf':'M8 32C4 14 19 5 34 4c1 17-8 27-26 28Zm-3 5L30 9m-15 15-1-9m6 4 9 1',
 'eye':'M3 20s6-11 17-11 17 11 17 11-6 11-17 11S3 20 3 20Zm22 0a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z',
 'speech':'M7 7h26v21H18L8 35v-7H7V7Zm7 8h12m-12 6h8',
 'path':'M8 8v9c0 8 24 0 24 9v6M8 4v8M4 8h8M28 32h8m-4-4v8',
 'sun':'M26 20a6 6 0 1 1-12 0 6 6 0 0 1 12 0ZM20 3v5m0 24v5M3 20h5m24 0h5M8 8l4 4m16 16 4 4M8 32l4-4M28 12l4-4',
 'hand':'M8 21v-5c0-3 5-3 5 0V8c0-3 5-3 5 0v10V6c0-3 5-3 5 0v12-7c0-3 5-3 5 0v9-4c0-3 5-3 5 0v10c0 8-5 11-13 11-7 0-9-7-12-10l-3-4c-2-3 1-5 3-2Z',
 'branch':'M20 36V7m0 20-11-8m11 1 11-10M9 19l1-7m21-2-7-1M20 13l-7-7',
}
def icon(name):return f'<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{paths[name]}"/></svg>'
def render(block):
 esc=html.escape
 if block.startswith('|'):
  rows=[[c.strip() for c in row.strip().strip('|').split('|')] for row in block.splitlines()]
  text='<table><thead><tr>'+''.join('<th scope="col">'+esc(c)+'</th>' for c in rows[0])+'</tr></thead><tbody>'
  for row in rows[2:]:text+='<tr>'+''.join(('<th scope="row">'+esc(c)+'</th>') if i==0 else '<td>'+esc(c)+'</td>' for i,c in enumerate(row))+'</tr>'
  return text+'</tbody></table>'
 if block.startswith('* '):return '<ul>'+''.join('<li>'+esc(x[2:])+'</li>' for x in block.splitlines())+'</ul>'
 kind=' class="note"' if block.startswith(('Attention :','Ces ressources','L’œuvre','L\'œuvre','La troisième question')) else ''
 return '<p'+kind+'>'+esc(block.replace('\n',' '))+'</p>'
def section(key,name):
 title=html.escape(key)
 return f'<section><h2>{icon(name)}<span>{title}</span></h2>'+''.join(render(b) for b in sections[key])+'</section>'
pages=[
 '<div class="cover-mark">'+icon('leaf')+'</div><p class="eyebrow">HAÏKUARELLE •°</p><h1>Guide pratique<br>du thérapeute</h1>'+''.join(render(b) for b in sections[keys[0]])+section(keys[1],'eye'),
 '<p class="eyebrow">ACCOMPAGNER SANS DIRIGER</p>'+section(keys[2],'speech'),
 '<p class="eyebrow">LE DÉROULÉ ET LES POSSIBILITÉS</p>'+section(keys[3],'path')+section(keys[4],'sun'),
 '<p class="eyebrow">ACCUEILLIR CE QUI SE VIT</p>'+section(keys[5],'speech')+section(keys[6],'hand'),
 '<p class="eyebrow">PROLONGER LA RENCONTRE</p>'+section(keys[7],'branch')+section(keys[8],'leaf')+'<div class="author">Une création de <strong>Pierre-Henri Garnier</strong><span>•°○</span></div>',
]
css='''@page{size:A4;margin:0}*{box-sizing:border-box}body{margin:0;background:#e9ece6;color:#354a3f;font:10.5pt/1.55 Arial,sans-serif}.page{position:relative;width:210mm;min-height:297mm;padding:17mm 18mm 20mm;background:white;margin:8mm auto;break-after:page}.page:last-child{break-after:auto}.eyebrow{font-size:8pt;letter-spacing:.16em;color:#5b715e;margin:0 0 6mm}h1{font:normal 32pt/1.12 Georgia,serif;letter-spacing:-.03em;margin:0 0 8mm}h2{display:flex;align-items:center;gap:4mm;font:normal 18pt/1.25 Georgia,serif;margin:8mm 0 5mm;break-after:avoid}h2 svg{width:10mm;height:10mm;flex:none;color:#66876c}p{margin:0 0 3.5mm;orphans:3;widows:3}.cover-mark{position:absolute;right:19mm;top:17mm;color:#759275}.cover-mark svg{width:21mm;height:21mm}.note{border-left:2px solid #88a47d;background:#f1f5ee;padding:3mm 4mm;font-size:9.5pt;margin-top:4mm}table{border-collapse:collapse;width:100%;font-size:9pt;line-height:1.45;margin:3mm 0 5mm;table-layout:fixed}th,td{padding:2.6mm 2.8mm;text-align:left;vertical-align:top;border-bottom:1px solid #dce4d8}thead th{background:#e8eee3;color:#304b38;font-weight:bold}tbody th{font-weight:normal}thead th:first-child,tbody th{width:25%}thead th:nth-child(2){width:48%}thead th:last-child{width:27%}tbody tr:nth-child(even){background:#f7f9f4}tr{break-inside:avoid}ul{padding-left:5mm;margin:0}li{padding:1.5mm 0;break-inside:avoid}footer{position:absolute;bottom:9mm;left:18mm;right:18mm;display:flex;justify-content:space-between;gap:5mm;padding-top:3mm;border-top:1px solid #dce4d8;font-size:8pt;color:#657863}.author{margin-top:10mm;padding:6mm 0;border-top:1px solid #dce4d8;font:italic 12pt/1.7 Georgia,serif}.author strong{font-weight:normal}.author span{float:right;color:#a3443d}.page:nth-child(3) table{font-size:9.5pt}.page:nth-child(3) h2{margin-top:6mm}@media print{body{background:white}.page{height:297mm;min-height:0;margin:0;overflow:visible}}'''
output='<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Haïkuarelle — Guide pratique du thérapeute</title><meta name="author" content="Pierre-Henri Garnier"><style>'+css+'</style></head><body>'
for i,page in enumerate(pages,1):output+=f'<article class="page">{page}<footer><span>HAÏKUARELLE •° · Guide du thérapeute</span><span>{i} / {len(pages)}</span></footer></article>'
output+='</body></html>'
html_path=ROOT/'public/guide-therapeute.html';html_path.write_text(output)
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--no-proxy-server']);page=browser.new_page();page.set_content(output);page.emulate_media(media='print')
 overflow=page.evaluate('''()=>[...document.querySelectorAll('.page')].map((p,i)=>({page:i+1,bottom:Math.max(...[...p.children].filter(e=>e.tagName!=='FOOTER').map(e=>e.getBoundingClientRect().bottom)),footer:p.querySelector('footer').getBoundingClientRect().top})).filter(p=>p.bottom>p.footer-10)''')
 if overflow:raise RuntimeError(f'Content reaches footer: {overflow}')
 page.pdf(path=str(ROOT/'public/guide-therapeute.pdf'),format='A4',print_background=True,prefer_css_page_size=True,tagged=True,outline=True);browser.close()
print('Created public/guide-therapeute.pdf (5 A4 pages)')
