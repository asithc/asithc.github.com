/**
 * Thanos Snap Effect
 * ==================
 * - Gauntlet infinity stones spark brightly with all stone colors
 * - Status badge pill slowly disintegrates into fine dust particles
 * - "Terminated" text fades in underneath
 * - After 60s (or on page refresh/revisit), "Terminated" fades out
 *   and the Thanos'd badge re-appears
 *
 * Uses sessionStorage to remember snap state across page visits.
 */
(function () {
    'use strict';

    var DUST_COLORS = ['#FFD700', '#FFA500', '#DAA520', '#B8860B', '#E8A317', '#CD853F', '#F4C430', '#FFE066', '#FFCC00', '#FF8C00'];
    var STONE_COLORS = ['#FFFF00', '#4169E1', '#DC143C', '#8A2BE2', '#00FF00', '#FF8C00']; // Mind, Space, Reality, Power, Time, Soul
    var SPARKLE_COLORS = ['#FFFFFF', '#FFFACD', '#FFE4B5', '#FFD700', '#FFF8DC'];
    var SNAP_DELAY = 1800;
    var RESTORE_DELAY = 60000;   // 60 seconds before badge restores
    var BADGE_DUST_COUNT = 200;  // dust particles from the badge itself
    var BADGE_SPARKLE_COUNT = 50;
    var STONE_SPARK_COUNT = 30;  // bright stone-colored sparks
    var LINK_DUST_COUNT = 180;

    var SESSION_KEY = 'thanos_snapped';

    // --- Initialise ---
    function init() {
        var badge = document.querySelector('.status-badge.is-thanosd');
        if (!badge) return;

        var wrapper = badge.closest('.thanos-status-wrapper');
        var terminatedEl = wrapper ? wrapper.querySelector('.terminated-text') : null;
        var gauntlet = badge.querySelector('.thanos-gauntlet');
        var metaSection = badge.closest('.project-meta-section');
        var metaLink = metaSection ? metaSection.querySelector('.meta-link') : null;

        // Check if previously snapped
        var wasSnapped = sessionStorage.getItem(SESSION_KEY);

        if (wasSnapped) {
            // Show terminated state instantly, then restore after a beat
            badge.style.transition = 'none';
            badge.classList.add('dusting');
            if (metaLink) { metaLink.style.opacity = '0'; metaLink.style.display = 'none'; }
            if (terminatedEl) {
                terminatedEl.style.transition = 'none';
                terminatedEl.classList.add('visible');
            }
            // Force reflow
            void badge.offsetWidth;

            // Now restore with animation after short pause
            setTimeout(function () {
                restoreBadge(badge, terminatedEl, metaLink);
                sessionStorage.removeItem(SESSION_KEY);
            }, 1200);
        } else {
            // Auto-play snap on first visit
            setTimeout(function () {
                playSnap(badge, gauntlet, terminatedEl, metaLink);
            }, SNAP_DELAY);
        }

        // Allow manual re-snap via gauntlet click
        if (gauntlet) {
            gauntlet.addEventListener('click', function () {
                if (badge.classList.contains('dusting')) return;
                playSnap(badge, gauntlet, terminatedEl, metaLink);
            });
        }
    }

    // --- Play the Snap ---
    function playSnap(badge, gauntlet, terminatedEl, metaLink) {
        // 1. Gauntlet snap animation (CSS handles brightness + stone glow)
        if (gauntlet) {
            gauntlet.classList.add('snapping');
        }

        // 2. After snap peaks, start stone sparks + badge disintegration
        setTimeout(function () {
            createStoneSparks(gauntlet || badge);
            createSparkleBurst(badge, 30);
        }, 300);

        // 3. Badge starts dusting (~600ms after snap)
        setTimeout(function () {
            disintegrateBadge(badge);
            createSparkleBurst(badge, BADGE_SPARKLE_COUNT);
            badge.classList.add('dusting');

            if (metaLink && metaLink.offsetParent !== null) {
                setTimeout(function () {
                    disintegrateElement(metaLink, LINK_DUST_COUNT);
                }, 400);
            }
        }, 600);

        // 4. Show "Terminated" text after badge has mostly dissolved
        setTimeout(function () {
            if (terminatedEl) {
                terminatedEl.classList.add('visible');
            }
        }, 2200);

        // 5. Mark as snapped in session
        setTimeout(function () {
            if (gauntlet) gauntlet.classList.remove('snapping');
            sessionStorage.setItem(SESSION_KEY, 'true');
        }, 1400);

        // 6. Auto-restore after 60 seconds
        setTimeout(function () {
            restoreBadge(badge, terminatedEl, metaLink);
            sessionStorage.removeItem(SESSION_KEY);
        }, RESTORE_DELAY);
    }

    // --- Restore Badge ---
    function restoreBadge(badge, terminatedEl, metaLink) {
        if (terminatedEl) {
            terminatedEl.classList.add('fading-out');
            terminatedEl.classList.remove('visible');
        }

        setTimeout(function () {
            badge.style.transition = 'opacity 1s ease-in, filter 1s ease-in, transform 1s ease-in';
            badge.classList.remove('dusting');

            if (terminatedEl) {
                terminatedEl.classList.remove('fading-out');
            }

            if (metaLink) {
                metaLink.style.display = '';
                metaLink.style.transition = 'opacity 0.8s ease-in 0.3s';
                metaLink.style.filter = '';
                void metaLink.offsetWidth;
                metaLink.style.opacity = '1';
            }
        }, 700);
    }

    // --- Stone Sparks (infinity stone colored bright bursts) ---
    function createStoneSparks(sourceEl) {
        var rect = sourceEl.getBoundingClientRect();
        var container = makeContainer();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;

        for (var i = 0; i < STONE_SPARK_COUNT; i++) {
            var color = STONE_COLORS[Math.floor(Math.random() * STONE_COLORS.length)];
            var angle = Math.random() * Math.PI * 2;
            var dist = 3 + Math.random() * 8;
            var x = cx + Math.cos(angle) * dist;
            var y = cy + Math.sin(angle) * dist;
            var vel = 60 + Math.random() * 120;
            var dx = Math.cos(angle) * vel;
            var dy = Math.sin(angle) * vel;
            var size = 2 + Math.random() * 5;
            var life = 400 + Math.random() * 800;

            var s = document.createElement('div');
            s.style.cssText =
                'position:fixed;pointer-events:none;border-radius:50%;' +
                'left:' + x + 'px;top:' + y + 'px;' +
                'width:' + size + 'px;height:' + size + 'px;' +
                'background:' + color + ';' +
                'box-shadow:0 0 ' + (size * 4) + 'px ' + (size * 2) + 'px ' + color + ';';
            container.appendChild(s);

            s.animate([
                { transform: 'translate(0,0) scale(1)', opacity: 1 },
                { transform: 'translate(' + (dx * 0.3) + 'px,' + (dy * 0.3) + 'px) scale(1.5)', opacity: 1, offset: 0.2 },
                { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0)', opacity: 0 }
            ], { duration: life, delay: Math.random() * 150, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)', fill: 'forwards' });
        }

        setTimeout(function () { container.remove(); }, 2000);
    }

    // --- Sparkle Burst ---
    function createSparkleBurst(sourceEl, count) {
        var rect = sourceEl.getBoundingClientRect();
        var container = makeContainer();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;

        for (var i = 0; i < count; i++) {
            var angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
            var dist = 3 + Math.random() * 15;
            spawnSparkle(container, {
                x: cx + Math.cos(angle) * dist,
                y: cy + Math.sin(angle) * dist,
                angle: angle,
                spread: 100 + Math.random() * 80,
                minLife: 300,
                maxLife: 1200,
                maxDelay: 120
            });
        }

        setTimeout(function () { container.remove(); }, 2500);
    }

    // --- Badge Disintegration (fine dust from the pill) ---
    function disintegrateBadge(badge) {
        var rect = badge.getBoundingClientRect();
        var container = makeContainer();

        for (var i = 0; i < BADGE_DUST_COUNT; i++) {
            var progress = i / BADGE_DUST_COUNT;
            var x = rect.left + Math.random() * rect.width;
            var y = rect.top + Math.random() * rect.height;

            spawnDust(container, {
                x: x,
                y: y,
                dirX: (Math.random() - 0.5) * 2.5,
                dirY: -(0.8 + Math.random() * 2),
                spread: 50 + Math.random() * 40,
                minLife: 800 + progress * 400,
                maxLife: 2500 + progress * 800,
                maxDelay: progress * 1200
            });
        }

        setTimeout(function () { container.remove(); }, 5000);
    }

    // --- Element Disintegration (meta-link etc.) ---
    function disintegrateElement(element, count) {
        var rect = element.getBoundingClientRect();
        var container = makeContainer();

        for (var i = 0; i < count; i++) {
            var progress = i / count;

            spawnDust(container, {
                x: rect.left + progress * rect.width + (Math.random() - 0.5) * 15,
                y: rect.top + Math.random() * rect.height,
                dirX: 1.2 + Math.random() * 1.5,
                dirY: -(0.5 + Math.random() * 1.5),
                spread: 60,
                minLife: 600,
                maxLife: 2400,
                maxDelay: progress * 800
            });
        }

        for (var j = 0; j < 25; j++) {
            var p2 = j / 25;
            spawnSparkle(container, {
                x: rect.left + p2 * rect.width + (Math.random() - 0.5) * 8,
                y: rect.top + Math.random() * rect.height,
                angle: -0.3 + Math.random() * 0.6,
                spread: 80 + Math.random() * 40,
                minLife: 300,
                maxLife: 1200,
                maxDelay: p2 * 500
            });
        }

        element.style.transition = 'opacity 1s ease-out, filter 1s ease-out';
        void element.offsetWidth;
        element.style.opacity = '0';
        element.style.filter = 'blur(5px)';

        setTimeout(function () {
            element.style.display = 'none';
            container.remove();
        }, 4000);
    }

    // --- Helpers ---
    function makeContainer() {
        var el = document.createElement('div');
        el.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;overflow:hidden;';
        document.body.appendChild(el);
        return el;
    }

    function spawnDust(container, o) {
        var p = document.createElement('div');
        var size = 0.4 + Math.random() * 2;
        var color = DUST_COLORS[Math.floor(Math.random() * DUST_COLORS.length)];

        p.style.cssText =
            'position:fixed;border-radius:50%;pointer-events:none;' +
            'left:' + o.x + 'px;top:' + o.y + 'px;' +
            'width:' + size + 'px;height:' + size + 'px;' +
            'background:' + color + ';' +
            'box-shadow:0 0 ' + (size + 1) + 'px ' + color + ';';

        container.appendChild(p);

        var angle = Math.random() * Math.PI * 2;
        var vel = Math.random() * o.spread + 10;
        var dx = Math.cos(angle) * vel;
        var dy = Math.sin(angle) * vel;

        if (o.dirX) dx += o.dirX * 30;
        if (o.dirY) dy += o.dirY * 25;

        var life = o.minLife + Math.random() * (o.maxLife - o.minLife);
        var delay = Math.random() * (o.maxDelay || 200);

        p.animate([
            { transform: 'translate(0,0) scale(1)', opacity: 0.9 },
            { transform: 'translate(' + (dx * 0.5) + 'px,' + (dy * 0.5) + 'px) scale(0.7)', opacity: 0.5 },
            { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0)', opacity: 0 }
        ], {
            duration: life,
            delay: delay,
            easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
            fill: 'forwards'
        });
    }

    function spawnSparkle(container, o) {
        var s = document.createElement('div');
        var size = 2 + Math.random() * 4;
        var color = SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)];

        s.style.cssText =
            'position:fixed;pointer-events:none;' +
            'left:' + o.x + 'px;top:' + o.y + 'px;' +
            'width:' + size + 'px;height:' + size + 'px;' +
            'background:' + color + ';border-radius:0;' +
            'clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);' +
            'box-shadow:0 0 ' + (size * 3) + 'px ' + size + 'px ' + color + ';';

        container.appendChild(s);

        var vel = Math.random() * o.spread + 20;
        var dx = Math.cos(o.angle) * vel;
        var dy = Math.sin(o.angle) * vel;
        var life = o.minLife + Math.random() * (o.maxLife - o.minLife);
        var delay = Math.random() * (o.maxDelay || 100);
        var rotation = (Math.random() - 0.5) * 720;

        s.animate([
            { transform: 'translate(0,0) scale(0) rotate(0deg)', opacity: 0 },
            { transform: 'translate(' + (dx * 0.15) + 'px,' + (dy * 0.15) + 'px) scale(1.8) rotate(' + (rotation * 0.3) + 'deg)', opacity: 1, offset: 0.15 },
            { transform: 'translate(' + (dx * 0.5) + 'px,' + (dy * 0.5) + 'px) scale(1) rotate(' + (rotation * 0.6) + 'deg)', opacity: 0.6, offset: 0.5 },
            { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0) rotate(' + rotation + 'deg)', opacity: 0 }
        ], {
            duration: life,
            delay: delay,
            easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
            fill: 'forwards'
        });
    }

    // --- Boot ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
