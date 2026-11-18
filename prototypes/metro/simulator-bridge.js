/* Same-origin shortcuts for the portfolio's phone simulator. */
let simulatorSceneTimer;
window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== parent || event.data?.type !== 'what-if:scene') return;
    const scenes = {
        home: () => setTab('explore'),
        planner: () => planJourney(),
        network: () => setTab('routes'),
        boarding: () => showQR(),
        wallet: () => setTab('wallet')
    };
    const action = scenes[event.data.scene];
    if (!action) return;
    clearTimeout(simulatorSceneTimer);
    closeModal();
    simulatorSceneTimer = setTimeout(() => {
        action();
        window.scrollTo(0, 0);
        parent.postMessage({ type: 'what-if:scene-applied', scene: event.data.scene, requestId: event.data.requestId }, location.origin);
    }, 220);
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !document.querySelector('.sheetback')) parent.postMessage({ type: 'what-if:escape' }, location.origin);
});
window.metroSimulatorReady = true;
parent.postMessage({ type: 'what-if:ready' }, location.origin);
