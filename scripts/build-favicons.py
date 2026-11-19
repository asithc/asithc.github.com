"""Build theme-aware icons from the signature's original A. Run on macOS with Swift."""
from pathlib import Path
import os
import re
import struct
import subprocess
import tempfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'favicon'
path = ET.parse(ROOT / 'images/asith-logo.svg').find('.//{http://www.w3.org/2000/svg}path').get('d')

# Sample the source cubic curves to centre the original letter, including its swash.
tokens = re.findall(r'[MCZ]|-?(?:\d*\.\d+|\d+\.?\d*)', path)
points = []
i = 0
while i < len(tokens):
    command = tokens[i]
    i += 1
    if command == 'M':
        current = tuple(map(float, tokens[i:i+2]))
        i += 2
        points.append(current)
    elif command == 'C':
        values = list(map(float, tokens[i:i+6]))
        i += 6
        control1, control2, end = values[:2], values[2:4], values[4:]
        for step in range(1, 41):
            t = step / 40
            points.append(tuple((1-t)**3 * current[d] + 3*(1-t)**2*t*control1[d]
                                + 3*(1-t)*t*t*control2[d] + t**3*end[d] for d in range(2)))
        current = end
x0, y0 = map(min, zip(*points))
x1, y1 = map(max, zip(*points))
scale = min(54 / (x1-x0), 54 / (y1-y0))
tx, ty = 32 - scale*(x0+x1)/2, 32 - scale*(y0+y1)/2
transform = f'translate({tx:.6f} {ty:.6f}) scale({scale:.6f})'
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <title>Asith signature A</title>
  <style>
    #signature-a {{ fill: #000000; stroke: #000000; }}
    @media (prefers-color-scheme: dark) {{
      #signature-a {{ fill: #ff2687; stroke: #ff2687; }}
    }}
  </style>
  <g transform="{transform}" stroke-linejoin="round">
    <path id="signature-a" d="{path}" fill="#000000" stroke="#000000" stroke-width="1.4"/>
  </g>
</svg>
'''
(OUT / 'favicon.svg').write_text(svg)
# Explicit colours keep raster exports independent of the renderer's theme.
def coloured_svg(colour):
    return re.sub(r'  <style>.*?</style>\n', '', svg, flags=re.S).replace('#000000', colour)

with tempfile.TemporaryDirectory(prefix='asith-favicons-') as tmp:
    executable = Path(tmp) / 'render'
    env = dict(os.environ, CLANG_MODULE_CACHE_PATH=str(Path(tmp) / 'cache'))
    subprocess.run(['swiftc', str(ROOT/'scripts/render-favicon.swift'), '-o', str(executable)], check=True, env=env)
    light_source, dark_source = Path(tmp)/'light.svg', Path(tmp)/'dark.svg'
    light_source.write_text(coloured_svg('#000000'))
    dark_source.write_text(coloured_svg('#ff2687'))
    targets = {'favicon-96x96.png':96, 'apple-touch-icon.png':180,
               'web-app-manifest-192x192.png':192, 'web-app-manifest-512x512.png':512}
    for name, size in targets.items():
        subprocess.run([str(executable), str(light_source), str(OUT/name), str(size)], check=True)
    subprocess.run([str(executable), str(dark_source), str(OUT/'favicon-dark-96x96.png'), '96'], check=True)
    images = []
    for size in [16, 32, 48, 64]:
        target = Path(tmp) / f'{size}.png'
        subprocess.run([str(executable), str(light_source), str(target), str(size)], check=True)
        images.append((size, target.read_bytes()))
    offset = 6 + 16*len(images)
    entries = []
    for size, data in images:
        entries.append(struct.pack('<BBBBHHII', size, size, 0, 0, 1, 32, len(data), offset))
        offset += len(data)
    (OUT/'favicon.ico').write_bytes(struct.pack('<HHH',0,1,len(images)) + b''.join(entries) + b''.join(data for _,data in images))
print('Built transparent signature-A icons: black for light themes, fire pink for dark themes.')
