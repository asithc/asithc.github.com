// PDF.js is imported only after a visitor asks to read the résumé.
const source = new URL('../files/Resume-Asith-Wijenayake-Lead-Product-Designer-International-12-Nov-2026.pdf', import.meta.url);
const dialog = document.createElement('dialog');
dialog.className = 'resume-reader';
dialog.setAttribute('aria-labelledby', 'resume-reader-title');
dialog.innerHTML = `<header class="resume-reader-header"><div><p>Career &amp; experience</p><h2 id="resume-reader-title">Asith’s résumé</h2></div><button type="button" data-reader-close aria-label="Close résumé">✕</button></header>
<div class="resume-reader-tools" role="group" aria-label="Document controls"><div><button type="button" data-prev aria-label="Previous page">←</button><span data-page aria-live="polite">Loading…</span><button type="button" data-next aria-label="Next page">→</button></div><div><button type="button" data-zoom-out aria-label="Zoom out">−</button><button type="button" data-fit>Fit</button><button type="button" data-zoom-in aria-label="Zoom in">+</button></div><a data-download download="Asith-Wijenayake-Resume.pdf">Download PDF ↓</a></div>
<div class="resume-reader-body" tabindex="0" aria-label="Résumé document"><p class="resume-reader-status" role="status">Loading résumé…</p><div class="resume-reader-page"></div><button type="button" data-retry hidden>Try again</button></div>`;
document.body.append(dialog);
const $ = selector => dialog.querySelector(selector);
$('[data-download]').href = source.href;
const container = $('.resume-reader-body');
const surface = $('.resume-reader-page');
const status = $('.resume-reader-status');
let documentPDF, pdfjs, pageNumber = 1, zoom = 1, generation = 0, opener, oldOverflow;
let loading;
async function load() {
    if (!loading) loading = (async () => {
        pdfjs = await import('./vendor/pdfjs/pdf.min.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdfjs/pdf.worker.min.mjs', import.meta.url).href;
        documentPDF = await pdfjs.getDocument({ url: source.href, standardFontDataUrl: new URL('./vendor/pdfjs/standard_fonts/', import.meta.url).href, wasmUrl: new URL('./vendor/pdfjs/wasm/', import.meta.url).href, isEvalSupported: false, disableRange: true, disableStream: true }).promise;
    })().catch(error => { loading = null; throw error; });
    await loading;
}
async function render() {
    const ownGeneration = ++generation;
    status.hidden = false;
    status.textContent = 'Loading résumé…';
    $('[data-retry]').hidden = true;
    try {
        await load();
        if (ownGeneration !== generation || !dialog.open) return;
        const page = await documentPDF.getPage(pageNumber);
        const base = page.getViewport({ scale: 1 });
        const scale = Math.min(1.35, Math.max(.2, (container.clientWidth - 32) / base.width)) * zoom;
        const viewport = page.getViewport({ scale });
        const layer = document.createElement('div');
        layer.className = 'resume-sheet';
        layer.style.width = `${viewport.width}px`;
        layer.style.height = `${viewport.height}px`;
        layer.style.setProperty('--total-scale-factor', scale);
        const canvas = document.createElement('canvas');
        canvas.setAttribute('aria-hidden', 'true');
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * ratio);
        canvas.height = Math.floor(viewport.height * ratio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        layer.append(canvas);
        const text = document.createElement('div');
        text.className = 'textLayer';
        text.setAttribute('aria-label', `Résumé page ${pageNumber}`);
        layer.append(text);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport, transform: [ratio, 0, 0, ratio, 0, 0] }).promise;
        await new pdfjs.TextLayer({ textContentSource: await page.getTextContent(), container: text, viewport }).render();
        if (ownGeneration !== generation || !dialog.open) return;
        surface.replaceChildren(layer);
        status.hidden = true;
        $('[data-page]').textContent = `${pageNumber} / ${documentPDF.numPages}`;
        $('[data-prev]').disabled = pageNumber === 1;
        $('[data-next]').disabled = pageNumber === documentPDF.numPages;
        $('[data-zoom-out]').disabled = zoom <= .8;
        $('[data-zoom-in]').disabled = zoom >= 2;
        container.scrollTop = 0;
    } catch (error) {
        if (ownGeneration !== generation || !dialog.open) return;
        status.textContent = 'The résumé could not load. Try again or download the PDF.';
        $('[data-page]').textContent = 'Unavailable';
        $('[data-retry]').hidden = false;
        console.error('Résumé viewer:', error);
    }
}
function close() { dialog.close(); }
$('[data-reader-close]').addEventListener('click', close);
dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
dialog.addEventListener('close', () => { ++generation; document.body.style.overflow = oldOverflow; opener?.focus(); });
$('[data-prev]').addEventListener('click', () => { if (documentPDF && pageNumber > 1) { pageNumber--; render(); } });
$('[data-next]').addEventListener('click', () => { if (documentPDF && pageNumber < documentPDF.numPages) { pageNumber++; render(); } });
$('[data-zoom-out]').addEventListener('click', () => { zoom = Math.max(.8, zoom - .2); render(); });
$('[data-zoom-in]').addEventListener('click', () => { zoom = Math.min(2, zoom + .2); render(); });
$('[data-fit]').addEventListener('click', () => { zoom = 1; render(); });
$('[data-retry]').addEventListener('click', render);
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); if (dialog.open) resizeTimer = setTimeout(render, 180); });
document.querySelectorAll('[data-resume-open]').forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = link;
    oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    render();
}));
