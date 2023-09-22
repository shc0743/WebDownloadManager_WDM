

const redir_url = chrome.runtime.getURL('/web/redirect.html');
chrome.tabs.onUpdated.addListener((tabId, changes, tab) => {
    if (changes.url === redir_url) {
        chrome.tabs.remove(tabId);
        chrome.tabs.create({ url: chrome.runtime.getURL('/web/index.html') });
    }
});


