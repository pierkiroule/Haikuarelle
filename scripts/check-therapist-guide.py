from pathlib import Path
import re,unicodedata
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
def norm(s):return ' '.join(unicodedata.normalize('NFKC',s).split())
source=(ROOT/'docs/guide-therapeute.md').read_text().replace('\\.','.')
expected=[]
for line in source.splitlines():
 line=line.strip()
 if not line:continue
 if line.startswith('|'):
  cells=[c.strip() for c in line.strip('|').split('|')]
  if all(re.fullmatch('[-: ]+',c) for c in cells):continue
  expected.extend(cells)
 else:expected.append(line.removeprefix('### ').removeprefix('* '))
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--no-proxy-server']);page=b.new_page(viewport={'width':390,'height':844},has_touch=True,accept_downloads=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.add_init_script("sessionStorage.setItem('haikuarelle-presentation-seen','1')");page.goto('http://localhost:5173');guide=page.locator('#guide-therapeute');summary=guide.locator('summary');summary.click();assert guide.get_attribute('open') is not None
 actual=norm(guide.inner_text())
 missing=[s for s in expected if norm(s) not in actual];assert not missing,missing
 assert guide.locator('tbody tr').count()==23 and guide.locator('h3').count()==8
 for w,h in [(320,568),(390,844),(1280,900)]:
  page.set_viewport_size({'width':w,'height':h});summary.scroll_into_view_if_needed();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path=f'/tmp/therapist-web-{w}.png');print({'width':w,'guideFits':True},flush=True)
 with page.expect_download() as item:page.get_by_role('link',name='Télécharger le guide illustré',exact=False).click()
 download=item.value;assert download.suggested_filename=='Haikuarelle-guide-du-therapeute.pdf';assert Path(download.path()).read_bytes().startswith(b'%PDF')
 page.get_by_role('button',name='Replier le guide').click();assert guide.get_attribute('open') is None;assert summary.evaluate('(el)=>el===document.activeElement')
 page.goto('http://localhost:5173/?guide=1#guide-therapeute');assert page.locator('#guide-therapeute').get_attribute('open') is not None
 print({'completeAuthoredContent':len(expected),'tables':3,'pdfDownload':True,'deepLink':True,'collapseFocus':True,'errors':errors});b.close()
