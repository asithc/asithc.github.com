(() => {
    const hover = matchMedia('(hover: hover) and (pointer: fine)');
    const selector = 'a.project-card[href*="projects/"], a.work-card[href*="projects/"]';
    if (!document.querySelector(selector)) return;
    const tip = document.createElement('div');
    tip.className = 'case-study-tip';
    tip.textContent = 'View case study';
    tip.setAttribute('aria-hidden', 'true');
    document.body.append(tip);
    let active = null;
    let frame = 0;
    let x = 0;
    let y = 0;
    const hide = () => {
        active = null;
        tip.classList.remove('is-visible');
        cancelAnimationFrame(frame);
        frame = 0;
    };
    const position = () => {
        frame = 0;
        const width = tip.offsetWidth;
        const height = tip.offsetHeight;
        const left = Math.max(12, Math.min(x + 18, innerWidth - width - 12));
        const top = y + height + 26 > innerHeight ? y - height - 14 : y + 20;
        tip.style.transform = `translate3d(${left}px, ${Math.max(12, top)}px, 0)`;
    };
    document.addEventListener('pointermove', event => {
        if (!hover.matches || event.pointerType !== 'mouse') return hide();
        const card = event.target.closest?.(selector);
        if (!card) return hide();
        x = event.clientX;
        y = event.clientY;
        if (active !== card) {
            active = card;
            position();
            tip.classList.add('is-visible');
        } else if (!frame) frame = requestAnimationFrame(position);
    }, { passive: true });
    document.addEventListener('pointerdown', hide, { passive: true });
    document.documentElement.addEventListener('pointerleave', hide);
    window.addEventListener('scroll', hide, { passive: true, capture: true });
    window.addEventListener('blur', hide);
    window.addEventListener('resize', hide);
    document.addEventListener('keydown', hide);
    hover.addEventListener('change', hide);
})();
