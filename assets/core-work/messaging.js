



const coreMessageHandler = {};

coreMessageHandler.create_task = function create_task(message, sender, sendResponse) {
    const canDownload = checkTaskCanDownload(message.url);
    if (!canDownload) return sendResponse({
        from: 'core', type: 'create_task_response',
        success: false, reason: 1,
        text: 'Cannot download this kind of file currently.'
    });
    const url = new URL('/web/create_task.html', location.href);
    url.searchParams.set('url', message.url);
    if (message.filename) url.searchParams.set('name', message.filename);
    chrome.windows.create({
        focused: true,
        type: 'popup',
        url: url.href,
        width: 640, height: 480,
    });
    sendResponse({
        from: 'core', type: 'create_task_response',
        eventId: message.eventId,
        success: true, pending: true,
        text: 'Waiting for user'
    });
};

import * as platformParser from '/ext/parser/PlatformParser_core.js';
coreMessageHandler.platform_parse = function platform_parse(message, sender, sendResponse) {
    platformParser.parse(message.url).then(result => {
        sendResponse({
            from: 'core', type: 'platform_parse_response',
            eventId: message.eventId,
            success: true,
            result
        });
    }).catch(error => {
        sendResponse({
            from: 'core', type: 'platform_parse_response',
            eventId: message.eventId,
            success: false, code: error?.code || -1,
            text: String(error?.stack || error)
        });
    });
    return true;
};
coreMessageHandler.get_ext_gateway_url = function get_ext_gateway_url(message, sender, sendResponse) {
    try {
        const url = new URL(message.data.url);
        const serviceName = url.host + url.pathname 
        /* 2024-12-7 Fix a bug that was caused by a behavior change in URL Object in new Chromium
        Before: URL(ext://downloader/foo).pathname == '//downloader/foo'
                URL(ext://downloader/foo).host     == ''
            * Seen in Chromium 122  (360se)
        After : URL(ext://downloader/foo).pathname == '/foo'
                URL(ext://downloader/foo).host     == 'downloader'
            * Seen in Chromium 131  (chrome latest)
        */
        const serviceUrl = '/ext/' + serviceName + '.html';
        const finalUrl = new URL(serviceUrl, location.href);
        finalUrl.search = url.search;
        finalUrl.hash = url.hash;
        sendResponse({
            from: 'core', type: 'get_ext_gateway_url_response',
            eventId: message.eventId,
            success: true,
            result: finalUrl.href
        });
    } catch (error) {
        sendResponse({
            from: 'core', type: 'get_ext_gateway_url_response',
            eventId: message.eventId,
            success: false, code: error?.code || -1,
            text: String(error?.stack || error)
        });
    }
};
coreMessageHandler.set_ctx_menu = function set_ctx_menu(message, sender, sendResponse) {
    (async () => {
        try {
            if (!message.noop) {
                const val = !!message.data.enabled;
                await chrome.storage.local.set({ 'ctx_menu': val ? (message.enhanced ? 'enhanced' : true) : false });
            }
            await updateCtxMenu();
            sendResponse({
                from: 'core', type: 'set_ctx_menu_response',
                eventId: message.eventId,
                success: true,
                result: true
            });
        } catch (error) {
            sendResponse({
                from: 'core', type: 'set_ctx_menu_response',
                eventId: message.eventId,
                success: false, code: error?.code || -1,
                text: String(error?.stack || error)
            });
        }
    })();
    return true;
};

import { DownloadFile, StartDownload } from '../../context/index.js';
import * as TaskStates from '../defs/index.js';

coreMessageHandler.request_download = function request_download(message, sender, sendResponse) {
    new Promise((resolve, reject) => {
        if (!message.url) {
            return reject(new TypeError("An URL is required to download."));
        }
        if (!message.name) {
            return reject(new TypeError("A name is required to save the downloaded file."));
        }
        if (null == message.entryId) {
            return reject(sendResponse({
                from: 'core', type: 'request_download_response',
                eventId: message.eventId,
                success: false,
                needAction: true,
                code: -0xE0000001,
                text: 'entry ID Required'
            }));
        };
        const entryId = message.entryId;
            
        DownloadFile(message.url, message.name, entryId).then((resp) => {
            if (!resp.success) {
                return reject(JSON.stringify(resp, null, 4));
            }
            resolve(resp);
        }).catch(error => reject(error));

        // reject('Not implemented')
    }).then(result => {
        sendResponse({
            from: 'core', type: 'request_download_response',
            eventId: message.eventId,
            success: true,
            result
        });
    }).catch(error => {
        sendResponse({
            from: 'core', type: 'request_download_response',
            eventId: message.eventId,
            success: false, code: error?.code || -1,
            text: String(error)
        });
    });
    return true;
};

coreMessageHandler.set_download_task_state = function set_download_task_state(message, sender, sendResponse) {
    const { influences, newState } = message;
    if (!influences || !newState) return;
    if (!([TaskStates.TASK_STATE_TO_START,
    TaskStates.TASK_STATE_TO_PAUSE,
    TaskStates.TASK_STATE_TO_STOP,
    TaskStates.TASK_STATE_TO_CANCEL
    ].includes(newState))) {
        return sendResponse({
            from: 'core', type: 'set_download_task_state_response',
            eventId: message.eventId,
            success: false, code: 87,
            text: 'Error: Invalid Parameter `newState`'
        });
    }

    const payload = async (taskId) => {
        if (newState === TaskStates.TASK_STATE_TO_START) {
            await StartDownload(taskId);
        } else {
            await taskManager.updateTask(taskId, { state: newState, status: newState });
        }
    };
    const handleError = (error) => sendResponse({
        from: 'core', type: 'set_download_task_state_response',
        eventId: message.eventId,
        success: false, code: -1,
        text: String(error),
    });

    if (influences === 'all') {
        taskManager.enumAll(({ id }) => payload(id)).then(resp => ((storage.taskShouldUpdate = (new Date().getTime())), sendResponse({
            from: 'core', type: 'set_download_task_state_response',
            eventId: message.eventId,
            success: true, result: resp,
            text: 'completed'
        }))).catch(handleError);
    } else if (!(Array.isArray(influences))) {
        return sendResponse({
            from: 'core', type: 'set_download_task_state_response',
            eventId: message.eventId,
            success: false, code: 87,
            text: 'Error: Invalid Parameter `influences`'
        });
    } else ((async () => {
        let latest_resp = null;
        for (const i of influences) {
            latest_resp = await payload(i);
        }
        storage.taskShouldUpdate = (new Date().getTime());
        sendResponse({
            from: 'core', type: 'set_download_task_state_response',
            eventId: message.eventId,
            success: true, result: latest_resp,
            text: 'completed'
        });
    })()).catch(handleError);
        
    return true;
};

export { coreMessageHandler };




import { pattern as download_type } from '/ext/ftypes/download_type.js';
function checkTaskCanDownload(url = '') {
    return download_type.test(url);
}


import { updateCtxMenu } from './contextMenu.js';

