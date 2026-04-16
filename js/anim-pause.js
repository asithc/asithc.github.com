/*!
 * anim-pause.js — pauses infinite CSS/WAAPI animations that the user cannot currently see.
 *
 * Zero visual difference when the animated element is on screen; when it scrolls
 * out of view (or the tab is backgrounded), the animation pauses so the browser
 * stops spending GPU / main-thread cycles on work the user cannot observe.
 *
 * Rules:
 *   - Only animations whose iteration count is Infinity are touched.
 *   - Finite reveal animations (.fade-in, one-shot transitions) are never paused.
 *   - Respects prefers-reduced-motion (bails out entirely — the page is mostly
 *     static in that mode anyway).
 *   - Re-scans periodically to catch dynamically-inserted animated elements
 *     (model-viewer, WhatsApp status viewer swaps, etc.).
 */
(function () {
    'use strict';

    if (typeof document === 'undefined') return;
    if (typeof document.getAnimations !== 'function') return; // older Safari / Firefox fallback: do nothing
    if (typeof IntersectionObserver === 'undefined') return;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    // element -> Set<Animation>
    var targetMap = new Map();
    var observed = new WeakSet();

    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            var el = entry.target;
            var anims = targetMap.get(el);
            if (!anims) return;
            if (entry.isIntersecting) {
                anims.forEach(function (a) { try { a.play(); } catch (e) {} });
            } else {
                anims.forEach(function (a) { try { a.pause(); } catch (e) {} });
            }
        });
    }, { rootMargin: '150px 0px' });

    function registerAnimation(anim) {
        if (!anim.effect) return;
        var iters;
        try { iters = anim.effect.getComputedTiming().iterations; }
        catch (e) { return; }
        if (iters !== Infinity) return;

        var target = anim.effect.target;
        if (!(target instanceof Element)) return;

        if (!targetMap.has(target)) targetMap.set(target, new Set());
        targetMap.get(target).add(anim);

        if (!observed.has(target)) {
            observed.add(target);
            io.observe(target);
        }
    }

    function scan() {
        var all;
        try { all = document.getAnimations(); }
        catch (e) { return; }
        all.forEach(registerAnimation);
    }

    // Initial scan — wait two rAFs so CSS animations on the first paint have been registered.
    function initialScan() {
        requestAnimationFrame(function () {
            requestAnimationFrame(scan);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialScan, { once: true });
    } else {
        initialScan();
    }

    // Catch animations added later (model-viewer, dynamic widgets). One follow-up
    // scan after 2 s covers most late-added animations without needing a MutationObserver.
    setTimeout(scan, 2000);
    setTimeout(scan, 6000);

    // Pause all infinite animations when the tab is hidden. Modern browsers throttle
    // rAF but don't necessarily pause CSS animations — this guarantees it.
    document.addEventListener('visibilitychange', function () {
        var anims;
        try { anims = document.getAnimations(); }
        catch (e) { return; }
        var hide = document.hidden;
        anims.forEach(function (a) {
            if (!a.effect) return;
            var iters;
            try { iters = a.effect.getComputedTiming().iterations; }
            catch (e) { return; }
            if (iters !== Infinity) return;
            try { hide ? a.pause() : a.play(); } catch (e) {}
        });
    });
})();
