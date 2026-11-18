/* The screenshots stay available without JavaScript; enhancement adds selectable views. */
(() => {
    const gallery = document.querySelector('.wp-product-stage');
    if (!gallery) return;
    const tabs = [...gallery.querySelectorAll('[data-wp-tab]')];
    const panels = [...gallery.querySelectorAll('[data-wp-panel]')];
    if (!tabs.length || tabs.length !== panels.length) return;

    function select(index, focus = false) {
        tabs.forEach((tab, i) => {
            tab.setAttribute('aria-selected', String(i === index));
            tab.tabIndex = i === index ? 0 : -1;
            panels[i].hidden = i !== index;
        });
        if (focus) tabs[index].focus();
    }

    const tablist = gallery.querySelector('.wp-view-tabs');
    tablist.setAttribute('role', 'tablist');
    const desktop = matchMedia('(min-width: 1001px)');
    const syncOrientation = () => tablist.setAttribute('aria-orientation', desktop.matches ? 'vertical' : 'horizontal');
    syncOrientation();
    desktop.addEventListener('change', syncOrientation);
    tabs.forEach((tab, index) => {
        tab.setAttribute('role', 'tab');
        panels[index].setAttribute('role', 'tabpanel');
        panels[index].setAttribute('aria-labelledby', tab.id);
        panels[index].tabIndex = 0;
        tab.addEventListener('click', () => select(index));
        tab.addEventListener('keydown', event => {
            let next;
            if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
            else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index + tabs.length - 1) % tabs.length;
            else if (event.key === 'Home') next = 0;
            else if (event.key === 'End') next = tabs.length - 1;
            else return;
            event.preventDefault();
            select(next, true);
        });
    });
    gallery.querySelectorAll('[data-wp-zoom]').forEach(link => {
        link.addEventListener('click', event => {
            if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            const image = link.closest('[data-wp-panel]').querySelector('.wp-product-screen');
            if (image.classList.contains('project-lightbox-trigger')) {
                event.preventDefault();
                image.click();
            }
        });
    });
    select(0);
    gallery.classList.add('wp-gallery-ready');
})();
