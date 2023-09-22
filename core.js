




chrome.runtime.onInstalled.addListener(() => {
    chrome.action.setBadgeText({
        text: "0",
    });
});
chrome.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
        chrome.storage.local.set({
            activated: true
        });
    }
});


globalThis.addEventListener('install', function (e) {
    console.log('[Service Worker] Install');
    e.waitUntil((async function () {
        globalThis.skipWaiting();
    })());
});

globalThis.addEventListener('activate', function (e) {
    e.waitUntil((async function () {
        await clients.claim();
    })());
});



//#region imports
import { TaskManager } from './context/download-core/Task.js';
//#endregion


//#region register utils

import './assets/scripts/storageApi.js';

import { INIT as userdata_INIT } from './assets/scripts/userdata.js';


globalThis.taskManager = new TaskManager();
userdata_INIT.then(() => taskManager.init(globalThis.userdata, 'taskStorage0'));


import './ext/parser/network_request_helper.js';


//#endregion



import { coreMessageHandler } from './assets/core-work/messaging.js';
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (!(message instanceof Object)) return console.warn('[core]', '[chrome.runtime.onMessage]', 'unknown message was received:', message);
    const handler = Reflect.get(coreMessageHandler, message.type);
    if (!handler) return console.warn('[core]', 'unknown message type', message.type);
    return handler.apply(this, arguments);
});




//#region Start Works
import './assets/core-work/contextMenu.js';
import './assets/core-work/web_Redirect.js';
//#endregion





