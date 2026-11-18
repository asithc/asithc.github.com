"""Run with python3 scripts/check-seo.py. No third-party dependencies."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote
from urllib.robotparser import RobotFileParser
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.meta = {}; self.canonical = []; self.schemas = []; self.title = ''; self.in_title = False; self.in_schema = False; self.h1 = 0; self.local_links = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'meta': self.meta[a.get('name', a.get('property', ''))] = a.get('content', '')
        if tag == 'link' and a.get('rel') == 'canonical': self.canonical.append(a['href'])
        if tag == 'title': self.in_title = True
        if tag == 'h1': self.h1 += 1
        if tag == 'script' and a.get('type') == 'application/ld+json': self.in_schema = True; self.schemas.append('')
        if tag in ('a', 'img', 'script', 'link'):
            value = a.get('href', a.get('src', ''))
            if value and not urlparse(value).scheme and not value.startswith('//'): self.local_links.append(value)
    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
        if tag == 'script': self.in_schema = False
    def handle_data(self, data):
        if self.in_title: self.title += data
        if self.in_schema: self.schemas[-1] += data

pages = [ROOT / p for p in ['index.html', 'about.html', 'work.html', 'contact.html', 'what-if.html']] + sorted((ROOT/'projects').glob('*.html'))
sitemap = {e.text for e in ET.parse(ROOT/'sitemap.xml').iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')}
errors = []; titles = set(); descriptions = set()
for path in pages:
    page = Page(); page.feed(path.read_text())
    def check(condition, message):
        if not condition: errors.append(f'{path.relative_to(ROOT)}: {message}')
    expected = 'https://asith.cc/' + ('' if path.name == 'index.html' else str(path.relative_to(ROOT)))
    check(page.canonical == [expected], 'canonical must be unique and match the public URL')
    check(expected in sitemap, 'missing from sitemap')
    check(bool(page.title) and page.title not in titles, 'missing or duplicate title'); titles.add(page.title)
    description = page.meta.get('description', '')
    check(bool(description) and description not in descriptions, 'missing or duplicate description'); descriptions.add(description)
    for key in ['og:title','og:description','og:image','twitter:card']:
        check(bool(page.meta.get(key)), f'missing {key}')
    check(page.h1 == 1, 'expected exactly one primary heading')
    check('noindex' not in page.meta.get('robots',''), 'public page marked noindex')
    check(bool(page.schemas), 'missing structured data')
    for schema in page.schemas:
        try: json.loads(schema)
        except json.JSONDecodeError: check(False, 'invalid JSON-LD')
    for link in page.local_links:
        value = unquote(urlparse(link).path)
        if not value: continue
        target = ROOT/value.lstrip('/') if value.startswith('/') else path.parent/value
        check(target.exists(), f'broken local resource: {link}')
    image = page.meta.get('og:image','')
    check((ROOT/unquote(urlparse(image).path).lstrip('/')).is_file(), 'missing social preview image')
robots = RobotFileParser(); robots.parse((ROOT/'robots.txt').read_text().splitlines())
for bot in ['Googlebot','Bingbot','OAI-SearchBot','ChatGPT-User','Claude-SearchBot','PerplexityBot']:
    if not robots.can_fetch(bot,'https://asith.cc/'): errors.append(f'{bot} cannot discover the public homepage')
    if robots.can_fetch(bot,'https://asith.cc/files/resume.pdf'): errors.append(f'{bot} is permitted to crawl résumé files')
for bot in ['GPTBot','ClaudeBot','CCBot']:
    if robots.can_fetch(bot,'https://asith.cc/'): errors.append(f'{bot} training opt-out missing')
if errors:
    print('\n'.join(errors)); raise SystemExit(1)
print(f'PASS: {len(pages)} pages; unique titles/descriptions; canonical URLs; social images; JSON-LD; sitemap; local resources; crawler policy.')
