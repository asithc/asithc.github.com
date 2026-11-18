import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MetalBadge, pauseShared, resumeShared } from 'metal-fx';

const motion = matchMedia('(prefers-reduced-motion: reduce)');
function syncMotion() {
    if (document.hidden || motion.matches) pauseShared();
    else resumeShared();
}
function NewBadge({ host }) {
    const [reduced, setReduced] = useState(motion.matches);
    useEffect(() => {
        const update = () => setReduced(motion.matches);
        motion.addEventListener('change', update);
        return () => motion.removeEventListener('change', update);
    }, []);
    useEffect(() => {
        host.dataset.metalReady = 'true';
        host.dataset.metalMode = reduced ? 'static' : 'metal';
        const frame = requestAnimationFrame(syncMotion);
        return () => cancelAnimationFrame(frame);
    }, [host, reduced]);
    if (reduced) return <span className="case-new-fallback" aria-hidden="true">New</span>;
    return <MetalBadge theme="light" strength={0.9} scale={1}>New</MetalBadge>;
}
const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const host = entry.target;
        observer.unobserve(host);
        createRoot(host).render(<NewBadge host={host} />);
    }
}, { rootMargin: '120px' });
document.querySelectorAll('[data-metal-badge]').forEach(host => observer.observe(host));
motion.addEventListener('change', syncMotion);
document.addEventListener('visibilitychange', syncMotion);
