(() => {
    const stage = document.querySelector('.wp-experience');
    if (!stage) return;
    let visible = false;
    const sync = () => stage.classList.toggle('wp-motion-running', visible && !document.hidden);
    if ('IntersectionObserver' in window) {
        new IntersectionObserver(entries => {
            visible = entries.some(entry => entry.isIntersecting);
            sync();
        }, { rootMargin: '80px' }).observe(stage);
    } else { visible = true; sync(); }
    document.addEventListener('visibilitychange', sync);
})();
