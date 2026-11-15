/* Progressive enhancement for the silent IFS Zero release recording. */
(() => {
    'use strict';

    const formatTime = seconds => {
        const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
        const hours = Math.floor(value / 3600);
        const minutes = Math.floor((value % 3600) / 60);
        const remainder = String(value % 60).padStart(2, '0');
        return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${remainder}` : `${minutes}:${remainder}`;
    };

    document.querySelectorAll('[data-release-player]').forEach(player => {
        const video = player.querySelector('video');
        const toggle = player.querySelector('[data-video-toggle]');
        const start = player.querySelector('[data-video-start]');
        const seek = player.querySelector('[data-video-seek]');
        const time = player.querySelector('[data-video-time]');
        const fullscreen = player.querySelector('[data-video-fullscreen]');
        const status = player.querySelector('[data-video-status]');
        if (!video || !toggle || !start || !seek || !time || !fullscreen) return;

        let scrubbing = false;
        const hasDuration = () => Number.isFinite(video.duration) && video.duration > 0;
        const isFullscreen = () => document.fullscreenElement === player || Boolean(video.webkitDisplayingFullscreen);

        function update() {
            const duration = hasDuration() ? video.duration : 0;
            const elapsed = Math.max(0, video.currentTime || 0);
            const progress = duration ? Math.min(1000, elapsed / duration * 1000) : 0;
            const playing = !video.paused && !video.ended;
            player.classList.toggle('is-playing', playing);
            player.classList.toggle('is-ended', video.ended);
            toggle.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
            start.setAttribute('aria-label', video.ended ? 'Replay video' : 'Play video');
            time.textContent = `${formatTime(elapsed)} / ${formatTime(duration)}`;
            if (!scrubbing) seek.value = String(progress);
            seek.disabled = !duration;
            seek.setAttribute('aria-valuetext', `${formatTime(elapsed)} of ${formatTime(duration)}`);
            player.style.setProperty('--video-progress', `${progress / 10}%`);
        }

        function showError() {
            player.classList.remove('is-loading', 'is-playing');
            if (status) status.hidden = false;
            update();
        }

        async function togglePlayback() {
            if (!video.paused && !video.ended) {
                video.pause();
                return;
            }
            if (video.ended) video.currentTime = 0;
            if (status) status.hidden = true;
            try {
                await video.play();
            } catch (error) {
                // Seeking or pausing during startup can legitimately cancel play().
                if (error.name !== 'AbortError') showError();
            }
        }

        function updateFullscreen() {
            const active = isFullscreen();
            fullscreen.setAttribute('aria-label', active ? 'Exit full screen' : 'Enter full screen');
            fullscreen.setAttribute('aria-pressed', String(active));
        }

        async function toggleFullscreen() {
            try {
                if (document.fullscreenElement) await document.exitFullscreen();
                else if (player.requestFullscreen) await player.requestFullscreen();
                else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
            } catch (_) {
                // Fullscreen availability does not affect video playback.
            }
            updateFullscreen();
        }

        function finishScrubbing() {
            scrubbing = false;
            update();
        }

        toggle.addEventListener('click', togglePlayback);
        start.addEventListener('click', togglePlayback);
        video.addEventListener('click', togglePlayback);
        seek.addEventListener('pointerdown', () => { scrubbing = true; });
        seek.addEventListener('input', () => {
            if (!hasDuration()) return;
            video.currentTime = Number(seek.value) / 1000 * video.duration;
            update();
        });
        seek.addEventListener('change', finishScrubbing);
        seek.addEventListener('blur', finishScrubbing);
        window.addEventListener('pointerup', () => { if (scrubbing) finishScrubbing(); });
        window.addEventListener('pointercancel', () => { if (scrubbing) finishScrubbing(); });
        fullscreen.addEventListener('click', toggleFullscreen);
        document.addEventListener('fullscreenchange', updateFullscreen);
        video.addEventListener('webkitbeginfullscreen', updateFullscreen);
        video.addEventListener('webkitendfullscreen', updateFullscreen);

        ['loadedmetadata', 'durationchange', 'timeupdate', 'play', 'pause', 'ended', 'seeked'].forEach(event => {
            video.addEventListener(event, update);
        });
        ['waiting', 'loadstart'].forEach(event => video.addEventListener(event, () => player.classList.toggle('is-loading', !video.paused)));
        ['canplay', 'playing', 'pause', 'ended'].forEach(event => video.addEventListener(event, () => player.classList.remove('is-loading')));
        video.addEventListener('error', showError);
        video.addEventListener('playing', () => { if (status) status.hidden = true; });

        if (!player.hasAttribute('tabindex')) player.tabIndex = 0;
        player.addEventListener('keydown', event => {
            if (event.target.closest('button,input,a,select,textarea,[contenteditable="true"]')) return;
            if (event.altKey || event.ctrlKey || event.metaKey) return;
            if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                togglePlayback();
            } else if ((event.key === 'ArrowLeft' || event.key === 'ArrowRight') && hasDuration()) {
                event.preventDefault();
                video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + (event.key === 'ArrowRight' ? 5 : -5)));
                update();
            } else if (event.key.toLowerCase() === 'f') {
                event.preventDefault();
                toggleFullscreen();
            }
        });

        fullscreen.hidden = !player.requestFullscreen && !video.webkitEnterFullscreen;
        updateFullscreen();
        update();
        player.classList.add('is-enhanced');
        video.controls = false;
        if (video.error) showError();
    });
})();
