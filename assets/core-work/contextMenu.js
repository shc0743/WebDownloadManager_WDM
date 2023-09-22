

export async function updateCtxMenu({ enhanced = false } = {}) {
    const { ctx_menu } = await chrome.storage.local.get(['ctx_menu']);
    await chrome.contextMenus.removeAll();
    if (!ctx_menu) return;

    await chrome.contextMenus.create({
        contexts: ["link"],
        documentUrlPatterns: ["http://*/*", "https://*/*", "file://*/*"],
        title: chrome.i18n.getMessage('ctxMenu_2_title_1'),
        id: '2-1',
    });
    await chrome.contextMenus.create({
        contexts: ["image"],
        documentUrlPatterns: ["http://*/*", "https://*/*", "file://*/*"],
        title: chrome.i18n.getMessage('ctxMenu_2_title_2'),
        id: '2-2',
    });
    await chrome.contextMenus.create({
        contexts: ["video", "audio"],
        documentUrlPatterns: ["http://*/*", "https://*/*", "file://*/*"],
        title: chrome.i18n.getMessage('ctxMenu_2_title_3'),
        id: '2-3',
    });
    if (ctx_menu === 'enhanced') {
        await chrome.contextMenus.create({
            contexts: ["page", "image", "video", "audio",],
            documentUrlPatterns: ["http://*/*", "https://*/*", "file://*/*"],
            title: chrome.i18n.getMessage('ctxMenu_3_title_1'),
            id: '3-1',
        });
        await chrome.contextMenus.create({
            contexts: ["link"],
            documentUrlPatterns: ["http://*/*", "https://*/*", "file://*/*"],
            title: chrome.i18n.getMessage('ctxMenu_3_title_2'),
            id: '3-2',
        });

    }
}


import { coreMessageHandler } from './messaging.js';



chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!['2-1', '2-2', '2-3'].includes(info.menuItemId)) return;
    const { linkUrl, srcUrl } = info;
    const url = (info.menuItemId === '2-1') ? (linkUrl || srcUrl) : (srcUrl || linkUrl);
    if (!url) try {
        // const [{ id: tabId }] = await chrome.tabs.query({ active: true, currentWindow: true });

        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: function () { alert('Error: No URL Found') },
        });
    } finally { return };

    coreMessageHandler.create_task({
        from: 'core',
        type: 'create_task',
        url: url,
    }, null, resp => {
        try {
            if (!resp.success) throw JSON.stringify(resp, null, 4);
        } catch (err) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: function (err) { alert('Error: ' + err) },
                args: [err]
            });
        }
    });
});
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!['3-1', '3-2'].includes(info.menuItemId)) return;
    const { linkUrl, pageUrl } = info;
    const url = (info.menuItemId === '3-1') ? (pageUrl || linkUrl) : (linkUrl || pageUrl);
    // console.log(url);
    if (!url) try {
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: function () { alert('Error: No URL Found') },
        });
    } finally { return };

    const turl = new URL(chrome.runtime.getURL('/web/download_tool.html'));
    turl.searchParams.set('action', 'runPlatformParser');
    turl.searchParams.set('argument', url);
    chrome.tabs.create({
        url: turl.href,
    });
});


chrome.runtime.onInstalled.addListener(() => {
    coreMessageHandler.set_ctx_menu({ noop: true }, null, () => { });
});


