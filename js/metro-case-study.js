/* The walkthroughs use real prototype captures and remain independent of the live app. */
(() => {
    const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('[data-flow]').forEach(flow => {
        const track = flow.querySelector('.mc-flow-track');
        const cards = [...track.children];
        const timeline = flow.querySelector('.mc-flow-timeline');
        const status = flow.querySelector('[data-flow-status]');
        const previous = flow.querySelector('[data-flow-prev]');
        const next = flow.querySelector('.mc-flow-controls [data-flow-next]');
        let current = 0, pending = false, requested = null;
        const points = cards.map((card, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = card.dataset.step;
            button.setAttribute('aria-label', `Step ${index + 1}: ${card.dataset.step}`);
            button.addEventListener('click', () => go(index));
            timeline.append(button);
            return button;
        });
        function update(index) {
            current = index;
            cards.forEach((card, i) => card.classList.toggle('is-current', i === index));
            points.forEach((point, i) => {
                point.classList.toggle('is-visited', i <= index);
                if (i === index) point.setAttribute('aria-current', 'step');
                else point.removeAttribute('aria-current');
            });
            previous.disabled = index === 0;
            next.disabled = index === cards.length - 1;
            status.textContent = `Step ${index + 1} of ${cards.length}: ${cards[index].dataset.step}`;
        }
        function leftFor(index) { return cards[index].offsetLeft - cards[0].offsetLeft; }
        function go(index) {
            const target = Math.max(0, Math.min(index, cards.length - 1));
            requested = target;
            update(target);
            track.scrollTo({ left: leftFor(target), behavior: reduceMotion() ? 'instant' : 'smooth' });
        }
        previous.addEventListener('click', () => go(current - 1));
        next.addEventListener('click', () => go(current + 1));
        cards.forEach((card, index) => card.querySelectorAll('[data-flow-next]').forEach(button => button.addEventListener('click', () => go(index + 1))));
        flow.querySelector('[data-flow-replay]').addEventListener('click', () => go(0));
        flow.querySelector('[data-flow-annotations]').addEventListener('click', event => {
            const button = event.currentTarget;
            const active = button.getAttribute('aria-pressed') !== 'true';
            button.setAttribute('aria-pressed', String(active));
            flow.classList.toggle('annotations-hidden', !active);
        });
        track.addEventListener('keydown', event => {
            if (event.target !== track) return;
            if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                event.preventDefault();
                go(current + (event.key === 'ArrowRight' ? 1 : -1));
            }
        });
        track.addEventListener('scroll', () => {
            if (pending) return;
            pending = true;
            requestAnimationFrame(() => {
                pending = false;
                if (requested !== null) { update(requested); return; }
                let nearest = 0, distance = Infinity;
                cards.forEach((_, index) => {
                    const delta = Math.abs(leftFor(index) - track.scrollLeft);
                    if (delta < distance) { distance = delta; nearest = index; }
                });
                // The last panel cannot always align left when several panels fit on screen.
                if (track.scrollLeft > 1 && track.scrollLeft >= track.scrollWidth - track.clientWidth - 3) nearest = cards.length - 1;
                update(nearest);
            });
        }, { passive: true });
        track.addEventListener('pointerdown', () => { requested = null; }, { passive:true });
        track.addEventListener('wheel', () => { requested = null; }, { passive:true });
        update(0);
    });
    const storyboard = document.querySelector('.mc-story-track');
    if (storyboard) {
        const previous = document.querySelector('[data-story-prev]');
        const next = document.querySelector('[data-story-next]');
        const sync = () => {
            previous.disabled = storyboard.scrollLeft < 2;
            next.disabled = storyboard.scrollLeft >= storyboard.scrollWidth - storyboard.clientWidth - 3;
        };
        function step(direction) {
            const width = storyboard.firstElementChild.getBoundingClientRect().width;
            const gap = parseFloat(getComputedStyle(storyboard).gap) || 0;
            storyboard.scrollBy({ left: direction * (width + gap), behavior: reduceMotion() ? 'instant' : 'smooth' });
        }
        previous.addEventListener('click', () => step(-1));
        next.addEventListener('click', () => step(1));
        storyboard.addEventListener('scroll', sync, { passive:true });
        window.addEventListener('resize', sync);
        sync();
    }
    const quickNav = document.querySelector('.mc-quick-nav');
    const toggle = quickNav?.querySelector('.mc-quick-toggle');
    const body = quickNav?.querySelector('.mc-quick-body');
    const links = [...document.querySelectorAll('.mc-quick-body nav a')];
    const sections = [...document.querySelectorAll('[data-study-section]')];
    let expanded = innerWidth >= 1440;
    function setExpanded(value, restoreFocus = false) {
        expanded = value;
        quickNav?.classList.toggle('is-minimised', !value);
        toggle?.setAttribute('aria-expanded', String(value));
        toggle?.setAttribute('aria-label', value ? 'Minimise case study contents' : 'Open case study contents');
        if (body) { body.hidden = !value; body.inert = !value; }
        if (restoreFocus) toggle?.focus({ preventScroll:true });
    }
    toggle?.addEventListener('click', () => setExpanded(!expanded));
    links.forEach(link => link.addEventListener('click', () => {
        if (innerWidth < 1440) setExpanded(false, true);
    }));
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && expanded && quickNav && !quickNav.hidden) setExpanded(false, true);
    });
    let readingPending = false;
    function readingPosition() {
        readingPending = false;
        if (!quickNav || !sections.length) return;
        const marker = Math.min(180, innerHeight * .24);
        const started = sections[0].getBoundingClientRect().top <= marker;
        quickNav.hidden = !started;
        quickNav.inert = !started;
        let active = sections[0];
        for (const section of sections) if (section.getBoundingClientRect().top <= marker) active = section;
        links.forEach(link => {
            const selected = link.hash === '#' + active.id;
            if (selected) {
                link.setAttribute('aria-current','location');
                quickNav.querySelector('.mc-quick-current').textContent = link.querySelector('span').textContent;
                toggle.title = `Case study contents: ${link.textContent.trim()}`;
            } else link.removeAttribute('aria-current');
        });
    }
    function queueReadingPosition() {
        if (!readingPending) { readingPending = true; requestAnimationFrame(readingPosition); }
    }
    window.addEventListener('scroll', queueReadingPosition, { passive:true });
    window.addEventListener('resize', queueReadingPosition);
    setExpanded(expanded);
    readingPosition();
})();
