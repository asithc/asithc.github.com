/* Pointer-distance magnification with native links and keyboard access. */
(() => {
    const tray = document.querySelector('.dock-tray');
    if (!tray) return;
    const apps = [...tray.querySelectorAll('.dock-app')];
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const preview = document.createElement('div');
    preview.className = 'dock-preview';
    preview.id = 'dock-profile-preview';
    preview.setAttribute('role', 'tooltip');
    preview.hidden = true;
    preview.innerHTML = '<div class="dock-preview-heading"><span class="dock-preview-icon" aria-hidden="true"></span><strong></strong></div><span class="dock-preview-url"></span><p class="dock-preview-description"></p>';
    tray.parentElement.appendChild(preview);
    let hideTimer;
    const hidePreview = () => {
        preview.hidden = true;
        preview.classList.remove('is-visible');
        apps.forEach(app => app.removeAttribute('aria-describedby'));
    };
    const scheduleHide = () => { clearTimeout(hideTimer); hideTimer = setTimeout(hidePreview, 100); };
    const showPreview = app => {
        clearTimeout(hideTimer);
        const icon = app.querySelector('.dock-app-inner');
        const svg = icon.querySelector('svg');
        const previewIcon = preview.querySelector('.dock-preview-icon');
        previewIcon.replaceChildren(svg.cloneNode(true));
        previewIcon.style.background = getComputedStyle(icon).background;
        previewIcon.querySelector('svg').style.color = getComputedStyle(svg).color;
        preview.querySelector('strong').textContent = app.getAttribute('aria-label');
        const url = new URL(app.href);
        preview.querySelector('.dock-preview-url').textContent = url.hostname.replace(/^www\./, '') + url.pathname;
        preview.querySelector('.dock-preview-description').textContent = app.dataset.description;
        apps.forEach(item => item.removeAttribute('aria-describedby'));
        app.setAttribute('aria-describedby', preview.id);
        preview.hidden = false;
        const target = app.getBoundingClientRect();
        const box = preview.getBoundingClientRect();
        preview.style.setProperty('--preview-arrow-left', `${Math.max(18, Math.min(box.width - 18, target.left + target.width / 2 - box.left))}px`);
        requestAnimationFrame(() => { if (!preview.hidden) preview.classList.add('is-visible'); });
    };
    tray.addEventListener('keydown', event => {
        if (event.key === 'Escape') { clearTimeout(hideTimer); hidePreview(); }
    });
    let centers = [];
    let maxGrowth = 16;
    let frame;
    const set = (app, amount) => {
        app.style.setProperty('--dock-grow', `${amount * maxGrowth}px`);
        app.style.setProperty('--dock-lift', `${amount * 5}px`);
    };
    const reset = () => { cancelAnimationFrame(frame); apps.forEach(app => set(app, 0)); };
    const measure = () => {
        const center = tray.getBoundingClientRect().left + tray.offsetWidth / 2;
        const style = getComputedStyle(tray);
        const gap = parseFloat(style.columnGap) || 0;
        const baseWidth = apps.length * 44 + (apps.length - 1) * gap + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
        maxGrowth = Math.min(16, Math.max(0, (tray.parentElement.clientWidth - baseWidth - 4) / 1.6));
        const spacing = 44 + gap;
        centers = apps.map((_, index) => center + (index - (apps.length - 1) / 2) * spacing);
    };
    tray.addEventListener('pointerenter', event => {
        if (event.pointerType !== 'mouse' || !finePointer.matches || reduced.matches) return;
        measure();
    });
    tray.addEventListener('pointermove', event => {
        if (event.pointerType !== 'mouse' || !finePointer.matches || reduced.matches) return;
        if (!centers.length) measure();
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => apps.forEach((app, index) => {
            const distance = Math.abs(event.clientX - centers[index]);
            const weight = Math.max(0, 1 - distance / 95);
            set(app, weight * weight);
        }));
    });
    tray.addEventListener('pointerleave', () => { centers = []; reset(); scheduleHide(); });
    apps.forEach((app, index) => {
        app.addEventListener('pointerenter', event => {
            if (event.pointerType === 'mouse' && finePointer.matches) showPreview(app);
        });
        app.addEventListener('focus', () => {
            if (!app.matches(':focus-visible')) return;
            showPreview(app);
            if (reduced.matches) return;
            measure();
            apps.forEach((item, i) => set(item, i === index ? 1 : Math.abs(i - index) === 1 ? .25 : 0));
        });
        app.addEventListener('blur', () => { reset(); scheduleHide(); });
        app.addEventListener('click', () => {
            const sound = document.getElementById('dockClickSound');
            if (sound) { sound.currentTime = 0; sound.play().catch(() => {}); }
        });
    });
    reduced.addEventListener('change', reset);
    finePointer.addEventListener('change', reset);
    window.addEventListener('resize', () => { centers = []; reset(); });
})();
