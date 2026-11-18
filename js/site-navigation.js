/* One navigation component for every portfolio page. */
(() => {
    const base = new URL('../', document.currentScript.src);
    const items = [['index.html', 'Home'], ['about.html', 'About'], ['work.html', 'Work'], ['contact.html', 'Contact']];
    const transitKey = 'portfolio:nav-origin';
    window.addEventListener('pageswap', () => {
        const component = document.querySelector('site-navigation');
        const index = component?.links?.findIndex(link => link.classList.contains('is-active'));
        if (index >= 0) {
            try { sessionStorage.setItem(transitKey, JSON.stringify({ index, time: Date.now() })); } catch (_) {}
        }
    });
    window.addEventListener('pagereveal', event => {
        document.querySelector('site-navigation')?.finishArrival(event.viewTransition);
    });
    class SiteNavigation extends HTMLElement {
        connectedCallback() {
            if (this.nav) return;
            // Moving clouds leave their clipped wrapper during every cycle.
            // The generic intersection-based animation helper must not freeze them.
            this.setAttribute('data-managed-motion', '');
            this.innerHTML = `<nav class="site-nav" aria-label="Main navigation"><span class="site-nav-selection" aria-hidden="true"></span>${items.map(([path, label]) => `<a class="site-nav-link${label === 'Work' ? ' site-nav-work' : ''}" href="${new URL(path, base)}">${label === 'Work' ? '<span class="site-nav-beam" aria-hidden="true"><i class="site-nav-cloud site-nav-cloud-blue"></i><i class="site-nav-cloud site-nav-cloud-pink"></i><i class="site-nav-cloud site-nav-cloud-amber"></i></span>' : ''}<span class="site-nav-label">${label}</span></a>`).join('')}</nav>`;
            this.nav = this.querySelector('nav');
            this.links = [...this.querySelectorAll('a')];
            this.syncVisibility = () => this.nav.classList.toggle('is-background', document.hidden);
            document.addEventListener('visibilitychange', this.syncVisibility);
            this.syncVisibility();
            this.pill = this.querySelector('.site-nav-selection');
            this.update();
            if (!('onpagereveal' in window)) this.finishArrival(null);
            this.resize = new ResizeObserver(() => this.align());
            this.resize.observe(this.nav);
            document.fonts?.ready.then(() => this.align());
            this.restore = () => { this.update(); };
            window.addEventListener('pageshow', this.restore);
            this.links.forEach(link => link.addEventListener('click', event => this.navigate(event, link)));
        }
        update() {
            const page = location.pathname.split('/').pop() || 'index.html';
            const project = location.pathname.includes('/projects/') || page === 'what-if.html';
            this.select(project ? 'work.html' : page);
        }
        select(page, animate = false) {
            this.links.forEach(link => {
                const active = new URL(link.href).pathname.split('/').pop() === page;
                link.classList.toggle('is-active', active);
                if (active) link.setAttribute('aria-current', (location.pathname.includes('/projects/') || location.pathname.endsWith('/what-if.html')) ? 'location' : 'page');
                else link.removeAttribute('aria-current');
            });
            this.align(animate);
        }
        align(animate = false) {
            const link = this.links.find(item => item.classList.contains('is-active'));
            if (!link) return;
            this.pill.style.transitionDuration = animate ? '320ms' : '0s';
            this.pill.style.width = `${link.offsetWidth}px`;
            this.pill.style.transform = `translateX(${link.offsetLeft}px)`;
        }
        finishArrival(nativeTransition) {
            let origin;
            try {
                origin = JSON.parse(sessionStorage.getItem(transitKey));
                sessionStorage.removeItem(transitKey);
            } catch (_) { return; }
            if (nativeTransition || !origin || Date.now() - origin.time > 10000 ||
                matchMedia('(prefers-reduced-motion: reduce)').matches) return;
            const previous = this.links[origin.index];
            const active = this.links.find(link => link.classList.contains('is-active'));
            if (!previous || !active || previous === active) return;
            // If a browser skips the cross-document transition, still enter from
            // the previous selection, before its first rendered frame.
            this.pill.animate([
                { transform: `translateX(${previous.offsetLeft}px)`, width: `${previous.offsetWidth}px` },
                { transform: `translateX(${active.offsetLeft}px)`, width: `${active.offsetWidth}px` }
            ], { duration: 320, easing: 'cubic-bezier(.22, 1, .36, 1)' });
        }
        navigate(event, link) {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            if (typeof playClickSound === 'function') playClickSound();
            try {
                sessionStorage.setItem(transitKey, JSON.stringify({
                    index: this.links.findIndex(item => item.classList.contains('is-active')),
                    time: Date.now()
                }));
            } catch (_) {}
            // Keep anchors and browser history native. No artificial navigation delay.
        }
        disconnectedCallback() {
            this.resize?.disconnect();
            document.removeEventListener('visibilitychange', this.syncVisibility);
            window.removeEventListener('pageshow', this.restore);
        }
    }
    if (!customElements.get('site-navigation')) customElements.define('site-navigation', SiteNavigation);
})();
