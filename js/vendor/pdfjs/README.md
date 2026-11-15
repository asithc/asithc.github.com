# PDF.js 6.5.438

Bundled from the exact npm package `pdfjs-dist@6.5.438` (Apache-2.0). See LICENSE.
Only the display module, dedicated worker, standard fonts and WebAssembly assets are included. The viewer imports the renderer only on demand; no third-party CDN request is needed.

`css/resume-text-layer.css` contains the matching upstream text-layer styles. Keep the main module and worker on the same version when updating. Verify page rendering, selectable text, keyboard controls and the offline/error state after upgrading.
