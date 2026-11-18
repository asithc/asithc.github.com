/* The concept page owns the phone frame; the existing LMT Go app owns its flows. */
(() => {
    const section = document.querySelector('.wi-simulator-section');
    if (!section) return;
    const workspace = section.querySelector('.wi-sim-workspace');
    const holder = section.querySelector('.wi-sim-holder');
    const device = section.querySelector('.wi-sim-device');
    const frame = section.querySelector('iframe');
    const shortcuts = [...section.querySelectorAll('[data-sim-scene]')];
    const expand = section.querySelector('[data-sim-expand]');
    const status = section.querySelector('[data-sim-status]');
    let ready = false, previousOverflow, sceneTimer;
    const sceneNames = { home:'Journey home', planner:'Journey planner', network:'Metro network', boarding:'Boarding code', wallet:'LMT Go wallet' };
    const expanded = () => document.fullscreenElement === workspace || workspace.classList.contains('is-expanded');
    function fit() {
        const deviceHeight = 414 * 1984 / 964;
        const availableHeight = expanded() ? window.innerHeight - 120 : deviceHeight;
        const scale = Math.max(.1, Math.min(1, (holder.clientWidth - 6) / 414, availableHeight / deviceHeight));
        holder.style.height = `${deviceHeight * scale}px`;
        device.style.transform = `translateX(-50%) scale(${scale})`;
    }
    function setReady(value) {
        ready = value;
        shortcuts.forEach(button => { button.disabled = !value; });
        status.textContent = value ? 'Interactive mobile prototype' : 'Loading prototype…';
    }
    function loaded() {
        try {
            if (!frame.contentWindow.location.pathname.includes('/prototypes/metro/') ||
                frame.contentWindow.metroSimulatorReady !== true) return;
        } catch (_) { return; }
        setReady(true);
        fit();
    }
    setReady(false);
    frame.addEventListener('load', loaded);
    try {
        if (frame.contentDocument?.readyState === 'complete' && frame.contentWindow.location.pathname.includes('/prototypes/metro/')) loaded();
    } catch (_) {}
    shortcuts.forEach(button => button.addEventListener('click', () => {
        if (!ready) return;
        const scene = button.dataset.simScene;
        clearTimeout(sceneTimer);
        status.textContent = `Opening ${sceneNames[scene].toLowerCase()}…`;
        const app = frame.contentWindow;
        const actions = {
            home: () => app.setTab('explore'),
            planner: () => app.planJourney(),
            network: () => app.setTab('routes'),
            boarding: () => app.showQR(),
            wallet: () => app.setTab('wallet')
        };
        app.closeModal();
        // Let the app finish closing its current sheet before opening the selected flow.
        sceneTimer = setTimeout(() => {
            actions[scene]();
            app.scrollTo(0, 0);
            status.textContent = sceneNames[scene];
            if (innerWidth <= 800) {
                workspace.scrollIntoView({ block:'center', behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
            }
        }, 220);
    }));
    section.querySelector('[data-sim-reset]').addEventListener('click', () => {
        if (!ready) return;
        clearTimeout(sceneTimer);
        ['metroConcept', 'metroNetworkSaved', 'metroBoardingChoice'].forEach(key => {
            try { frame.contentWindow.localStorage.removeItem(key); } catch (_) {}
        });
        setReady(false);
        frame.contentWindow.location.reload();
    });
    function syncFullscreen() {
        const active = expanded();
        expand.setAttribute('aria-expanded', String(active));
        expand.setAttribute('aria-label', active ? 'Exit expanded simulator' : 'Expand mobile simulator');
        fit();
    }
    function closeFallback() {
        workspace.classList.remove('is-expanded');
        document.body.style.overflow = previousOverflow || '';
        syncFullscreen();
        expand.focus();
    }
    expand.addEventListener('click', async () => {
        if (document.fullscreenElement === workspace) await document.exitFullscreen();
        else if (workspace.classList.contains('is-expanded')) closeFallback();
        else if (workspace.requestFullscreen) {
            try { await workspace.requestFullscreen(); } catch (_) { openFallback(); }
        } else openFallback();
        syncFullscreen();
    });
    function openFallback() {
        previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        workspace.classList.add('is-expanded');
        fit();
    }
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && workspace.classList.contains('is-expanded')) closeFallback();
    });
    window.addEventListener('message', event => {
        if (event.origin === location.origin && event.source === frame.contentWindow && event.data?.type === 'what-if:ready') loaded();
        if (event.origin === location.origin && event.source === frame.contentWindow && event.data?.type === 'what-if:escape' && workspace.classList.contains('is-expanded')) closeFallback();
    });
    window.addEventListener('resize', fit);
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(holder);
    fit();
})();
