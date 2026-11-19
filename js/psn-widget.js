(() => {
    const widget = document.querySelector('.psn-library');
    if (!widget) return;
    const cards = [...widget.querySelectorAll('.ps-library-game')];
    if (cards.length < 2) return;
    const pagination = widget.querySelector('.ps-library-pagination');
    const heading = widget.querySelector('.ps-library-label');
    const headingRow = widget.querySelector('.ps-library-heading');
    const footer = widget.querySelector('.ps-header');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pauses = new Set();
    let index = 0;
    let timer = 0;
    let deadline = 0;
    let remaining = 16000;
    const dots = cards.map(() => {
        const dot = document.createElement('i');
        pagination.append(dot);
        return dot;
    });
    const hold = () => index === 0 ? 16000 : 4000;
    const fitCaption = () => {
        const details = cards[index].querySelector('.ps-game-details');
        const captionBottom = 14 + footer.offsetHeight + 12;
        widget.style.setProperty('--ps-caption-bottom', `${captionBottom}px`);
        const minimum = Math.ceil(headingRow.offsetTop + headingRow.offsetHeight + 16 + details.offsetHeight + captionBottom);
        const value = `${minimum}px`;
        if (widget.style.getPropertyValue('--ps-min-height') === value) return;
        widget.style.setProperty('--ps-min-height', value);
        window.dispatchEvent(new Event('resize'));
    };
    const schedule = () => {
        clearTimeout(timer);
        if (pauses.size) return;
        deadline = performance.now() + remaining;
        timer = window.setTimeout(() => {
            timer = 0;
            show((index + 1) % cards.length);
        }, remaining);
    };
    const pause = (reason, on) => {
        const wasPaused = pauses.size > 0;
        if (on) pauses.add(reason);
        else pauses.delete(reason);
        widget.toggleAttribute('data-paused', pauses.size > 0);
        if (!wasPaused && pauses.size) {
            if (timer) remaining = Math.max(0, deadline - performance.now());
            clearTimeout(timer);
            timer = 0;
        } else if (wasPaused && !pauses.size) schedule();
    };
    const show = next => {
        index = next;
        remaining = hold();
        widget.style.setProperty('--ps-hold', `${remaining}ms`);
        cards.forEach((card, i) => {
            card.hidden = i !== index;
            card.classList.toggle('is-active', i === index);
            card.classList.toggle('is-entering', i === index);
            dots[i].classList.toggle('is-current', i === index);
        });
        heading.textContent = index === 0 ? 'Currently playing' : 'Recently played';
        fitCaption();
        schedule();
    };
    widget.addEventListener('pointerenter', event => {
        if (event.pointerType !== 'touch') pause('hover', true);
    });
    widget.addEventListener('pointerleave', () => pause('hover', false));
    widget.addEventListener('focusin', () => pause('focus', true));
    widget.addEventListener('focusout', event => {
        if (!widget.contains(event.relatedTarget)) pause('focus', false);
    });
    document.addEventListener('visibilitychange', () => pause('hidden', document.hidden));
    const updateMotion = () => pause('motion', reducedMotion.matches);
    if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', updateMotion);
    else reducedMotion.addListener(updateMotion);
    if (document.hidden) pauses.add('hidden');
    if (reducedMotion.matches) pauses.add('motion');
    if ('IntersectionObserver' in window) {
        pauses.add('offscreen');
        const observer = new IntersectionObserver(entries => {
            pause('offscreen', !entries[0].isIntersecting || entries[0].intersectionRatio < 0.15);
        }, { threshold: 0.15 });
        observer.observe(widget);
    }
    widget.toggleAttribute('data-paused', pauses.size > 0);
    show(0);
    if ('ResizeObserver' in window) {
        const layout = new ResizeObserver(fitCaption);
        layout.observe(widget);
        layout.observe(headingRow);
        layout.observe(footer);
        cards.forEach(card => layout.observe(card.querySelector('.ps-game-details')));
    }
    if (document.fonts) document.fonts.ready.then(fitCaption);
})();
