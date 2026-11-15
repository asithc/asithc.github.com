/* Interactive scope detail and visibility-aware animation for the IFS Zero illustration. */
(() => {
    'use strict';
    const section = document.querySelector('.iz-experience');
    if (!section) return;
    const values = { 1: '1,402.6', 2: '873.4', 3: '14,908.2' };
    const cards = [...section.querySelectorAll('[data-scope]')];
    const rings = [...section.querySelectorAll('[data-ring]')];
    const value = section.querySelector('[data-chart-value]');
    const label = section.querySelector('[data-chart-label]');
    cards.forEach(card => card.addEventListener('click', () => {
        const scope = card.getAttribute('aria-pressed') === 'true' ? null : card.dataset.scope;
        cards.forEach(item => item.setAttribute('aria-pressed', String(item.dataset.scope === scope)));
        rings.forEach(ring => ring.classList.toggle('iz-dimmed', Boolean(scope && ring.dataset.ring !== scope)));
        value.textContent = scope ? values[scope] : '17,184.2';
        label.textContent = scope ? `Scope ${scope}` : 'All scopes';
    }));
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            const visible = entries.some(entry => entry.isIntersecting);
            if (visible) section.classList.add('iz-animated');
            section.classList.toggle('iz-offscreen', !visible);
        }, { threshold: 0, rootMargin: '80px' });
        observer.observe(section);
    } else section.classList.add('iz-animated');
})();
