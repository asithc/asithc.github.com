(() => {
    const played = [...document.querySelectorAll('time[data-game-last-played]')];
    const started = [...document.querySelectorAll('[data-game-started]')];
    if (!played.length && !started.length) return;

    const relative = new Intl.RelativeTimeFormat('en', { numeric: 'always' });
    const absolute = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });
    const units = [
        ['year', 365 * 86400], ['month', 30 * 86400], ['week', 7 * 86400],
        ['day', 86400], ['hour', 3600], ['minute', 60]
    ];
    const elapsed = (timestamp, now) => Math.max(0, (now - timestamp) / 1000);
    const since = seconds => {
        const unit = units.find(([, length]) => seconds >= length);
        return unit ? relative.format(-Math.floor(seconds / unit[1]), unit[0]) : 'just now';
    };

    const update = () => {
        const now = Date.now();
        played.forEach(element => {
            const timestamp = Date.parse(element.dateTime);
            if (!Number.isFinite(timestamp)) {
                element.textContent = 'Not recorded';
                return;
            }
            element.textContent = since(elapsed(timestamp, now));
            element.title = absolute.format(new Date(timestamp));
        });
        started.forEach(element => {
            const timestamp = Date.parse(element.dataset.gameStarted);
            if (!Number.isFinite(timestamp)) return;
            const seconds = elapsed(timestamp, now);
            element.textContent = seconds < 86400 ? 'Just started playing' : `Started ${since(seconds)}`;
        });
    };

    // Saved session dates are the source of truth, never page-load or cache times.
    update();
    window.setInterval(() => { if (!document.hidden) update(); }, 30000);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
    window.addEventListener('pageshow', update);
})();
