(() => {
    const tenure = document.querySelector('[data-experience-reveal]');
    if (!tenure || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
            tenure.classList.add('is-revealing');
            observer.disconnect();
        }
    }, { threshold: .65 });
    observer.observe(tenure);
})();

(() => {
    const list = document.querySelector('.professional-capabilities');
    if (!list) return;
    const skills = [...list.children];
    skills.forEach((skill, index) => { skill.dataset.skillTone = String(index % 4); });
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lanes = document.createElement('div');
    lanes.className = 'skill-lanes';
    lanes.setAttribute('aria-hidden', 'true');
    list.after(lanes);
    function build() {
        lanes.replaceChildren();
        [skills.filter((_, i) => i % 2 === 0), skills.filter((_, i) => i % 2 === 1)].forEach(row => {
            const lane = document.createElement('div');
            lane.className = 'skill-lane';
            const track = document.createElement('div');
            track.className = 'skill-track';
            const group = document.createElement('div');
            group.className = 'skill-group';
            track.append(group); lane.append(track); lanes.append(lane);
            const appendSet = () => row.forEach(skill => {
                const pill = document.createElement('span');
                pill.className = 'skill-pill';
                pill.dataset.skillTone = skill.dataset.skillTone;
                pill.textContent = skill.textContent;
                group.append(pill);
            });
            appendSet();
            // Both halves fill the viewport, keeping the repeat seamless at every size.
            while (group.getBoundingClientRect().width < lanes.clientWidth + 32 && group.children.length < 40) appendSet();
            track.append(group.cloneNode(true));
        });
    }
    build();
    list.closest('.professional-card').classList.add('has-skill-lanes');
    let resizeTimer;
    if ('ResizeObserver' in window) {
        let previousWidth = lanes.clientWidth;
        new ResizeObserver(() => {
            if (lanes.clientWidth === previousWidth) return;
            previousWidth = lanes.clientWidth;
            clearTimeout(resizeTimer); resizeTimer = setTimeout(build, 100);
        }).observe(lanes);
    }
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
        lanes.classList.toggle('is-offscreen', !entries[0].isIntersecting);
    }).observe(lanes);
})();
