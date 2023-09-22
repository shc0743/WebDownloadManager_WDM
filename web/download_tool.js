
globalThis.addEventListener('click', function (ev) {
    if (ev.target.localName === 'a' && ev.target.getAttribute('href') === '#nop') return ev.preventDefault();
}, true);


document.title = chrome.i18n.getMessage('Download_Tool');



friot_btn.onclick = () => {
    friot_container.innerHTML = 'Loading...';
    friot_tabchoose.showModal();

    friot_update();
}
async function friot_update() {
    const tabs = await chrome.tabs.query({});
    friot_container.innerHTML = '';
    for (const i of tabs) {
        const el = document.createElement('div');
        el.className = 'friot-item friot-item-container';

        const caption = document.createElement('label');
        caption.style.display = 'block';
        const cb = document.createElement('input');
        cb.type = 'radio', cb.name = 'friot', cb.required = true;
        cb.dataset.tabId = i.id;
        caption.append(cb);
        const title = document.createElement('b');
        title.innerText = ` [${i.id}] ${i.title}`;
        if (i.discarded) { title.prepend(' [discarded]'); cb.disabled = true; }
        caption.append(title);
        el.append(caption);

        const url = document.createElement('div');
        url.style.color = 'gray';
        url.innerText = i.url;
        el.append(url);

        friot_container.append(el);
    }
}


const resources = document.getElementById('friot_resultarea');
let res_lastEvtId = -1, res_hasReceivedFirstMessage = false, res_rstfn = null;
friot_run.onsubmit = function (ev) {
    if (!ev.submitter?.dataset.submit) return;
    const id = +friot_container.querySelector('input:checked')?.dataset.tabId;
    if (!id || isNaN(id)) return;
    friot_result.showModal();

    friot_resultarea.innerHTML = 'Connecting...';

    res_lastEvtId = new (Date)().getTime().toString(); res_hasReceivedFirstMessage = false;
    const port = chrome.tabs.connect(id, { name: res_lastEvtId }, );
    port.onMessage.addListener(resGetCallback);
    port.onDisconnect.addListener(() => {
        if (chrome.runtime.lastError) {
            resources.classList.contains('loading') && resources.classList.remove('loading');
            if (!res_hasReceivedFirstMessage) {
                res_hasReceivedFirstMessage = true;
                setTimeout(res_rstfn, 1000);
            }
            resources.innerHTML = '<b style="color:red">Runtime Error</b><br>';
            resources.append(document.createTextNode('Error: ' + JSON.stringify(chrome.runtime.lastError, null, 4)));
        };
    });
    port.postMessage({ from: 'popup', type: 'queryResources', eventId: res_lastEvtId });
    res_rstfn = () => port.disconnect();
    resources.innerHTML = '';
    resources.classList.add('loading');
};
import { pattern as download_type } from '/ext/ftypes/download_type.js';
function resGetCallback(request) {
    if (request.eventId !== res_lastEvtId) return;
    resources.classList.contains('loading') && resources.classList.remove('loading');
    if (!res_hasReceivedFirstMessage) {
        res_hasReceivedFirstMessage = true;
        if (typeof res_rstfn === 'function') {
            setTimeout(res_rstfn, 60000);
            res_rstfn = null;
        }
    }

    const res = request.result;
    for (const i of res) {
        const el = document.createElement('div');
        el.className = 'res-list-item';
        const el1 = document.createElement('div');
        el1.className = 'res-list-content-container';
        el.append(el1);

        const elTitle = document.createElement('div');
        elTitle.className = 'res-list-content is-title';
        elTitle.innerText = elTitle.title = i.title || 'untitled';
        el1.append(elTitle);
        const elBtn = document.createElement('button');

        if (!(i.url.startsWith('ext://') || i.url.startsWith('blob:'))) {
        }

        const elCustomInfo = document.createElement('div');
        elCustomInfo.className = 'res-list-content is-info';
        elCustomInfo.innerText = elCustomInfo.title = i.customInfo || '';
        el1.append(elCustomInfo);

        const elUrl = document.createElement('div');
        elUrl.className = 'res-list-content is-url';
        elUrl.innerText = elUrl.title = i.url;
        el1.append(elUrl);

        elBtn.className = 'download-button el-button el-button--primary el-button--small is-plain';
        elBtn.innerHTML = (i.url.startsWith('ext://')) ? 'Continue' : 'Download';
        elBtn._url = i.url;
        elBtn._title = i.title + (i.filename_suffix || '');
        el.append(elBtn);

        resources.append(el);


        if (!(download_type.test(i.url))) {
            elBtn.disabled = !!(elBtn.innerHTML = 'Not Supported');
        }

    }
}

function runDownload(url, filename = null) {
    if (url.startsWith('file://')) {
        return window.open(url);
    }
    return chrome.runtime.sendMessage({
        from: 'popup',
        type: 'create_task',
        url, filename,
    })
}
resources.addEventListener('click', function ({ target }) {
    if (!target._url) return;
    runDownload(target._url, target._title);
}, { capture: true });


pr_form.onsubmit = function (ev) {
    ev.preventDefault();

    pr_btn.disabled = true, pr_btn.dataset.i18n = 'dtParsing';
    res_lastEvtId = new (Date)().getTime().toString(); res_hasReceivedFirstMessage = false;
    

    resources.innerHTML = '';
    resources.classList.add('loading');

    chrome.runtime.sendMessage({
        from: 'popup',
        type: 'platform_parse',
        url: pr_url.value,
        eventId: res_lastEvtId,
    }).then(resp => {
        if (!resp.success) throw resp;
        friot_result.showModal();
        resGetCallback(resp);
    }).catch(error => {
        console.warn('[popup]', 'cannot parse result:', error);
        alert('ERROR: ' + JSON.stringify(error));
    }).finally(() => {
        pr_btn.disabled = false, pr_btn.dataset.i18n = 'dtParse';
    });


}


fetch(chrome.runtime.getURL('/web/supported_platforms.txt')).then(v => v.text()).then(text => {
    for (const i of (text.split('\n').filter(el => !!el))) {
        const el = document.createElement('li');
        el.innerText = i;
        platformParse_supportedPlatforms.append(el)
    }
});


queueMicrotask(() => {
    const url = new URL(globalThis.location.href);
    const action = url.searchParams.get('action');
    const arg = url.searchParams.get('argument');
    if (!action) return;
    switch (action) {
        case 'runPlatformParser': {
            pr_url.value = arg;
            pr_btn.click();
            friot_result.addEventListener('close', () => resources.innerText === '' && globalThis.close());
        }
            break;
    
        default: {
            const el = document.createElement('div');
            el.popover = 'auto';
            el.append('Error: Invalid Parameter "action"=');
            el.append(document.createTextNode(action));
            document.body.append(el);
            // document.addEventListener('click', () => el.remove(), { once: true });
            el.showPopover();
        }
    }
});






