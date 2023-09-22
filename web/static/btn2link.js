
globalThis.addEventListener('click', function (ev) {
    const url = ev.target?.getAttribute('data-btn2link-url');
    if (null == url) return;
    ev.preventDefault();
    const target = ev.target?.getAttribute('data-btn2link-target') || '_self';
    if (target === 'popup') {
        const url2 = new URL(url, location.href);
        const size = (ev.target?.getAttribute('data-btn2link-window-size') || '1024x768').split('x');
        return chrome.windows.create({
            focused: true,
            type: 'popup',
            url: url2.href,
            width: +size[0], height: +size[1],
        });
    }
    return window.open(url, target);
});

