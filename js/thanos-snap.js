/**
 * Thanos Snap Effect
 * ==================
 * - Gauntlet infinity stones spark brightly with all stone colors
 * - Status badge pill slowly disintegrates into fine dust particles
 * - "Terminated" text fades in underneath
 * - After 60s, "Terminated" fades out
 *   and the Thanos'd badge re-appears
 */
(function () {
    'use strict';

    var DUST_COLORS = ['#FFD700', '#FFA500', '#DAA520', '#B8860B', '#E8A317', '#CD853F', '#F4C430', '#FFE066', '#FFCC00', '#FF8C00'];
    var STONE_COLORS = ['#FFFF00', '#4169E1', '#DC143C', '#8A2BE2', '#00FF00', '#FF8C00']; // Mind, Space, Reality, Power, Time, Soul
    var SPARKLE_COLORS = ['#FFFFFF', '#FFFACD', '#FFE4B5', '#FFD700', '#FFF8DC'];
    var RESTORE_DELAY = 60000;   // 60 seconds before badge restores
    var BADGE_DUST_COUNT = 1500; // optimized for 60fps performance
    var BADGE_SPARKLE_COUNT = 50;
    var STONE_SPARK_COUNT = 70;  // bright laser sparks from infinity stones
    var LINK_DUST_COUNT = 350;

    // --- Initialise ---
    function init() {
        var badge = document.querySelector('.status-badge.is-thanosd');
        if (!badge) return;

        var wrapper = badge.closest('.thanos-status-wrapper');
        var terminatedEl = wrapper ? wrapper.querySelector('.terminated-text') : null;
        var gauntlet = badge.querySelector('.thanos-gauntlet');
        var metaSection = badge.closest('.project-meta-section');
        var metaLink = metaSection ? metaSection.querySelector('.meta-link') : null;

        // Trigger on click of the entire badge (no autoplay on page entry)
        badge.style.cursor = 'pointer';
        badge.addEventListener('click', function () {
            if (badge.classList.contains('dusting')) return;
            playSnap(badge, gauntlet, terminatedEl, metaLink);
        });
    }

    // --- Play the Snap ---
    function playSnap(badge, gauntlet, terminatedEl, metaLink) {
        // 1. Gauntlet snap animation (CSS handles brightness + stone glow)
        if (gauntlet) {
            gauntlet.classList.add('snapping');
        }

        // 2. Stone laser sparks burst immediately - lasts 1.3s
        setTimeout(function () {
            createStoneSparks(gauntlet || badge);
        }, 50);

        // 3. After stone sparks end (1.3s) + 1s wait = start dust at 2.3s
        setTimeout(function () {
            disintegrateBadge(badge);
            createSparkleBurst(badge, BADGE_SPARKLE_COUNT);
            
            // Force GPU acceleration for badge
            badge.style.willChange = 'transform, opacity, filter';
            badge.style.transform = 'translateZ(0)';
            badge.style.backfaceVisibility = 'hidden';
            
            // Animate badge fade with JS - slow gradual disintegration
            // Badge breaks apart slowly, particles emerge continuously
            badge.animate([
                { opacity: 1, filter: 'blur(0px)', transform: 'scale(1) translateZ(0)' },
                { opacity: 0.82, filter: 'blur(0.8px)', transform: 'scale(0.99) translateZ(0)', offset: 0.15 },
                { opacity: 0.6, filter: 'blur(1.8px)', transform: 'scale(0.97) translateZ(0)', offset: 0.35 },
                { opacity: 0.35, filter: 'blur(3.5px)', transform: 'scale(0.94) translateZ(0)', offset: 0.6 },
                { opacity: 0.1, filter: 'blur(5.5px)', transform: 'scale(0.9) translateZ(0)', offset: 0.85 },
                { opacity: 0, filter: 'blur(7px)', transform: 'scale(0.88) translateZ(0)' }
            ], {
                duration: 5200,
                easing: 'cubic-bezier(0.33, 0.0, 0.67, 1)',
                fill: 'forwards'
            });
            
            // Mark as dusting for state tracking
            badge.classList.add('dusting');

            if (metaLink && metaLink.offsetParent !== null) {
                setTimeout(function () {
                    disintegrateElement(metaLink, LINK_DUST_COUNT);
                }, 600);
            }
        }, 2300);

        // 4. Show "Terminated" text as badge slowly dissolves (~4.5s)
        setTimeout(function () {
            if (terminatedEl) {
                terminatedEl.classList.add('visible');
            }
        }, 4500);

        // 5. End gauntlet snap animation state
        setTimeout(function () {
            if (gauntlet) gauntlet.classList.remove('snapping');
        }, 1400);

        // 6. Auto-restore after 60 seconds
        setTimeout(function () {
            restoreBadge(badge, terminatedEl, metaLink);
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

    // --- Stone Sparks (infinity stone laser beams) ---
    function createStoneSparks(sourceEl) {
        var rect = sourceEl.getBoundingClientRect();
        var container = makeContainer();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;

        for (var i = 0; i < STONE_SPARK_COUNT; i++) {
            var color = STONE_COLORS[Math.floor(Math.random() * STONE_COLORS.length)];
            var angle = Math.random() * Math.PI * 2;
            var dist = 2 + Math.random() * 6;
            var x = cx + Math.cos(angle) * dist;
            var y = cy + Math.sin(angle) * dist;
            
            // Laser-like: much higher velocity for beam effect
            var vel = 150 + Math.random() * 250;
            var dx = Math.cos(angle) * vel;
            var dy = Math.sin(angle) * vel;
            
            // Laser sparks: thin elongated streaks
            var width = 1.5 + Math.random() * 2;
            var height = 8 + Math.random() * 18; // Long streaks
            
            // All sparks last exactly 1.3 seconds, staggered start for burst effect
            var delay = Math.random() * 400; // Stagger over first 400ms
            var life = 1300;

            var s = document.createElement('div');
            s.style.cssText =
                'position:fixed;pointer-events:none;will-change:transform,opacity;' +
                'transform:translateZ(0);backface-visibility:hidden;' +
                'left:' + x + 'px;top:' + y + 'px;' +
                'width:' + width + 'px;height:' + height + 'px;' +
                'background:linear-gradient(to bottom, ' + color + ', transparent);' +
                'transform-origin:center top;' +
                'box-shadow:0 0 ' + (height * 1.2) + 'px ' + (width * 2) + 'px ' + color + ';' +
                'filter:brightness(1.6);';
            container.appendChild(s);

            s.animate([
                { opacity: 0, transform: 'rotate(' + (angle * 180 / Math.PI + 90) + 'deg) translateY(0) translateZ(0) scale(1, 0.5)' },
                { opacity: 1, transform: 'rotate(' + (angle * 180 / Math.PI + 90) + 'deg) translateY(' + (vel * -0.15) + 'px) translateZ(0) scale(1, 1.8)', offset: 0.12 },
                { opacity: 0.95, transform: 'rotate(' + (angle * 180 / Math.PI + 90) + 'deg) translateY(' + (vel * -0.5) + 'px) translateZ(0) scale(1, 1.5)', offset: 0.5 },
                { opacity: 0.4, transform: 'rotate(' + (angle * 180 / Math.PI + 90) + 'deg) translateY(' + (vel * -0.85) + 'px) translateZ(0) scale(0.8, 1)', offset: 0.8 },
                { opacity: 0, transform: 'rotate(' + (angle * 180 / Math.PI + 90) + 'deg) translateY(' + (-vel) + 'px) translateZ(0) scale(0.4, 0.5)' }
            ], { 
                duration: life, 
                delay: delay, 
                easing: 'cubic-bezier(0.16, 0.85, 0.45, 1)', 
                fill: 'forwards' 
            });
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
                spread: 110 + Math.random() * 90,
                minLife: 500,
                maxLife: 2000,
                maxDelay: 200
            });
        }

        setTimeout(function () { container.remove(); }, 4000);
    }

    // --- Badge Disintegration (fine dust from the pill) ---
    function disintegrateBadge(badge) {
        var rect = badge.getBoundingClientRect();
        var container = makeContainer();
        var vw = window.innerWidth;
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var maxRadius = Math.max(rect.width, rect.height) * 0.6;

        for (var i = 0; i < BADGE_DUST_COUNT; i++) {
            var progress = i / BADGE_DUST_COUNT;
            
            // Center-weighted radial distribution for organic cloud
            // Use square root for center bias, then add scatter
            var radiusFactor = Math.sqrt(Math.random()); // Concentrates particles near center
            var angle = Math.random() * Math.PI * 2;
            var radius = radiusFactor * maxRadius;
            
            // Add generous scatter for organic, non-uniform appearance
            var scatterX = (Math.random() - 0.5) * rect.width * 0.6;
            var scatterY = (Math.random() - 0.5) * rect.height * 0.6;
            
            var x = cx + Math.cos(angle) * radius + scatterX;
            var y = cy + Math.sin(angle) * radius + scatterY;

            // Bias: strong rightward drift + upward rise
            // dirX: mostly positive (rightward), range ~0.5 to 3.5
            // dirY: always negative (upward), range ~-0.4 to -2.2
            var rightBias = 0.5 + Math.random() * 3.0;
            var upBias    = -(0.4 + Math.random() * 1.8);

            // Later particles travel further for a sweeping dissolve
            var spreadVal = 60 + Math.random() * 80 + progress * 60;
            
            // Slow, gradual spawn - particles emerge over 5 seconds
            // Using gentle curve for smooth, continuous emission
            var delayVal = Math.pow(progress, 1.8) * 5000;

            spawnDust(container, {
                x: x,
                y: y,
                dirX: rightBias,
                dirY: upBias,
                spread: spreadVal,
                minLife: 4000 + progress * 2000,
                maxLife: 6000 + progress * 3000,
                maxDelay: delayVal,
                vw: vw
            });
        }

        setTimeout(function () { container.remove(); }, 16000);
    }

    // --- Element Disintegration (meta-link etc.) ---
    function disintegrateElement(element, count) {
        var rect = element.getBoundingClientRect();
        var container = makeContainer();

        var vw = window.innerWidth;
        for (var i = 0; i < count; i++) {
            var progress = i / count;

            spawnDust(container, {
                x: rect.left + progress * rect.width + (Math.random() - 0.5) * 15,
                y: rect.top + Math.random() * rect.height,
                dirX: 1.0 + Math.random() * 2.5,
                dirY: -(0.4 + Math.random() * 1.6),
                spread: 70 + Math.random() * 50,
                minLife: 2500,
                maxLife: 5000,
                maxDelay: progress * 1600,
                vw: vw
            });
        }

        for (var j = 0; j < 35; j++) {
            var p2 = j / 35;
            spawnSparkle(container, {
                x: rect.left + p2 * rect.width + (Math.random() - 0.5) * 8,
                y: rect.top + Math.random() * rect.height,
                angle: -0.3 + Math.random() * 0.6,
                spread: 80 + Math.random() * 40,
                minLife: 500,
                maxLife: 2000,
                maxDelay: p2 * 800
            });
        }

        element.style.transition = 'opacity 2s ease-out, filter 2s ease-out';
        void element.offsetWidth;
        element.style.opacity = '0';
        element.style.filter = 'blur(5px)';

        setTimeout(function () {
            element.style.display = 'none';
            container.remove();
        }, 7000);
    }

    // --- Helpers ---
    function makeContainer() {
        var el = document.createElement('div');
        el.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;overflow:visible;will-change:contents;transform:translateZ(0);contain:layout style paint;';
        document.body.appendChild(el);
        return el;
    }

    function spawnDust(container, o) {
        var p = document.createElement('div');
        var size = 0.3 + Math.random() * 2.0;
        var color = DUST_COLORS[Math.floor(Math.random() * DUST_COLORS.length)];

        p.style.cssText =
            'position:fixed;border-radius:50%;pointer-events:none;will-change:transform,opacity;' +
            'transform:translateZ(0);backface-visibility:hidden;' +
            'left:' + o.x + 'px;top:' + o.y + 'px;' +
            'width:' + size + 'px;height:' + size + 'px;' +
            'background:' + color + ';' +
            'box-shadow:0 0 ' + (size * 2) + 'px ' + color + ';';

        container.appendChild(p);

        // --- Direction: primarily UP-RIGHT with organic spread ---
        // Base angle biased toward upper-right quadrant (-π/4 to -3π/8)
        // then add some random scatter
        var baseAngle = -(Math.PI * 0.15) - Math.random() * (Math.PI * 0.35); // ~-27° to -90° (up-right)
        var scatter = (Math.random() - 0.5) * (Math.PI * 0.45); // ±40° scatter
        var angle = baseAngle + scatter;

        // Viewport-aware velocity: particles should travel 30%-80% of viewport width
        var vw = o.vw || window.innerWidth;
        var travelDist = vw * (0.25 + Math.random() * 0.55); // 25%-80% of viewport
        var vel = travelDist * (0.3 + Math.random() * 0.7);

        var dx = Math.cos(angle) * vel;
        var dy = Math.sin(angle) * vel;

        // Apply directional bias on top
        if (o.dirX) dx += o.dirX * 40;
        if (o.dirY) dy += o.dirY * 30;

        // Ensure rightward and upward: clamp dx positive, dy negative
        dx = Math.abs(dx) * (0.6 + Math.random() * 0.4);
        dy = -Math.abs(dy) * (0.4 + Math.random() * 0.6);

        // Add gentle sinusoidal wobble via intermediate waypoints
        var wobbleX = (Math.random() - 0.5) * 60;
        var wobbleY = (Math.random() - 0.5) * 40;

        var life = o.minLife + Math.random() * (o.maxLife - o.minLife);
        var delay = Math.random() * (o.maxDelay || 200);

        p.animate([
            { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 0.85 },
            { transform: 'translate3d(' + (dx * 0.15 + wobbleX) + 'px,' + (dy * 0.15 + wobbleY) + 'px, 0) scale(0.95)', opacity: 0.7, offset: 0.15 },
            { transform: 'translate3d(' + (dx * 0.4 - wobbleX * 0.5) + 'px,' + (dy * 0.4 - wobbleY * 0.5) + 'px, 0) scale(0.8)', opacity: 0.5, offset: 0.4 },
            { transform: 'translate3d(' + (dx * 0.7 + wobbleX * 0.3) + 'px,' + (dy * 0.7) + 'px, 0) scale(0.5)', opacity: 0.25, offset: 0.7 },
            { transform: 'translate3d(' + dx + 'px,' + dy + 'px, 0) scale(0)', opacity: 0 }
        ], {
            duration: life,
            delay: delay,
            easing: 'cubic-bezier(0.16, 0.73, 0.29, 0.96)',
            fill: 'forwards'
        });
    }

    function spawnSparkle(container, o) {
        var s = document.createElement('div');
        var size = 2 + Math.random() * 4;
        var color = SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)];

        s.style.cssText =
            'position:fixed;pointer-events:none;will-change:transform,opacity;' +
            'transform:translateZ(0);backface-visibility:hidden;' +
            'left:' + o.x + 'px;top:' + o.y + 'px;' +
            'width:' + size + 'px;height:' + size + 'px;' +
            'background:' + color + ';border-radius:0;' +
            'clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);' +
            'box-shadow:0 0 ' + (size * 2.5) + 'px ' + color + ';';

        container.appendChild(s);

        var vel = Math.random() * o.spread + 20;
        var dx = Math.cos(o.angle) * vel;
        var dy = Math.sin(o.angle) * vel;
        var life = o.minLife + Math.random() * (o.maxLife - o.minLife);
        var delay = Math.random() * (o.maxDelay || 100);
        var rotation = (Math.random() - 0.5) * 720;

        s.animate([
            { transform: 'translate3d(0, 0, 0) scale(0) rotate(0deg)', opacity: 0 },
            { transform: 'translate3d(' + (dx * 0.15) + 'px,' + (dy * 0.15) + 'px, 0) scale(1.8) rotate(' + (rotation * 0.3) + 'deg)', opacity: 1, offset: 0.15 },
            { transform: 'translate3d(' + (dx * 0.5) + 'px,' + (dy * 0.5) + 'px, 0) scale(1) rotate(' + (rotation * 0.6) + 'deg)', opacity: 0.6, offset: 0.5 },
            { transform: 'translate3d(' + dx + 'px,' + dy + 'px, 0) scale(0) rotate(' + rotation + 'deg)', opacity: 0 }
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
