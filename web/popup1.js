

{ const url = new URL(location.href);
if(url.searchParams.get('embedded')) document.querySelector('body > [data-from=page]').hidden = true; }


let res_lastEvtId = -1, res_hasReceivedFirstMessage = false, res_rstfn = null;
findResource.onclick = async function () {
    if (this.disabled) return;
    this.disabled = true;
    // this.setAttribute('disabled', '');
    // this.classList.add('is-disabled', 'is-loading');

    const currentTabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = currentTabs[0];
    if (!currentTab) {
        resources.innerHTML = '<br>Nothing found';
    } else {
        const id = currentTab.id;
        res_lastEvtId = new (Date)().getTime().toString(); res_hasReceivedFirstMessage = false;
        // const ret = chrome.tabs.sendMessage(id, { from: 'popup', type: 'queryResources', }, {},);
        const port = chrome.tabs.connect(id, { name: res_lastEvtId });
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

        const el = document.createElement('div');
        el.className = 'res-list-item';
        const el1 = document.createElement('div');
        el1.className = 'res-list-content-container';
        el.append(el1);
        el1.innerHTML = 'Platform parse running';
        resources.append(el);

        chrome.runtime.sendMessage({
            from: 'popup',
            type: 'platform_parse',
            url: currentTab.url,
            eventId: res_lastEvtId,
        }, resp => {
            el.remove();
            try {
                if (!resp.success) throw resp;
                resGetCallback(resp);
            } catch (error) {
                console.warn('[popup]', 'cannot parse result', resp, ':', error);
            }
        });

    }

    // this.classList.remove('is-disabled', 'is-loading')
    this.removeAttribute('disabled');
    this.disabled = false;
}
import mime_types from '/ext/ftypes/MIME.js';
import { pattern as download_type } from '/ext/ftypes/download_type.js';
function resGetCallback(request) {
    if (request.eventId !== res_lastEvtId) return;
    resources.classList.contains('loading') && resources.classList.remove('loading');
    if (!res_hasReceivedFirstMessage) {
        res_hasReceivedFirstMessage = true;
        setTimeout(res_rstfn, 60000);
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
            const elInfo1 = document.createElement('div');
            elInfo1.className = 'res-list-content is-info';
            elInfo1.innerText = 'MIME Type: Testing';
            el1.append(elInfo1);
            const elInfo2 = document.createElement('div');
            elInfo2.className = 'res-list-content is-info';
            elInfo2.innerText = 'Size: Testing';
            el1.append(elInfo2);

            fetch(i.url, { method: 'HEAD', credentials: 'include' }).then(resp => {
                if (resp.ok) {
                    elInfo1.innerText = 'MIME Type: ' + resp.headers.get('content-type') || 'unknown';
                    elInfo2.innerText = 'Size: ' + resp.headers.get('content-length') || 'unknown';
                    if (!i.filename_suffix) {
                        const ft = mime_types[resp.headers.get('content-type')];
                        if (ft) {
                            const ext = '.' + ft;
                            if (!elBtn._title.endsWith(ext)) elBtn._title += ext;
                        }
                    }
                } else {
                    elBtn.disabled = true;
                    throw 'HTTP Error ' + resp.status;
                }
            }).catch(error => {
                elInfo1.innerText = 'ERROR! ' + error;
                elInfo2.innerText = 'Size: unknown';
            });
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
download.onclick = function (ev) {
    const val = d0.value;
    if (ev.shiftKey || !val) {
        // return window.open('/web/create_task.html');
        return chrome.windows.create({
            focused: true,
            type: 'popup',
            url: '/web/create_task.html',
            width: 640, height: 480,
        });
    }
    if (!val) {
        // return d0.focus();
    }
    runDownload(val);
}
resources.addEventListener('click', function ({ target }) {
    if (!target._url) return;
    runDownload(target._url, target._title);
}, { capture: true });


