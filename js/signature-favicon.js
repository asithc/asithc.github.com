(() => {
    const icon = document.querySelector('link[data-signature-icon]');
    if (!icon || !window.matchMedia) return;

    const theme = window.matchMedia('(prefers-color-scheme: dark)');
    const version = new URL(icon.href).search;
    const base = new URL('.', icon.href);

    // One active icon makes theme changes consistent across browser favicon caches.
    document.querySelectorAll('link[rel~="icon"]').forEach(link => {
        if (link !== icon) link.remove();
    });
    const update = () => {
        const file = theme.matches ? 'favicon-dark-96x96.png' : 'favicon-96x96.png';
        icon.type = 'image/png';
        icon.sizes = '96x96';
        icon.href = new URL(file + version, base).href;
    };
    update();
    if (theme.addEventListener) theme.addEventListener('change', update);
    else theme.addListener(update);
})();
