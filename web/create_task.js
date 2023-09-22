const data = {};

if (sessionStorage.getItem('url')) {
    data.url = sessionStorage.getItem('url');
}
if (sessionStorage.getItem('name')) {
    data.name = sessionStorage.getItem('name');
}

const currentUrl = new URL(location.href);
if (!data.url) data.url = currentUrl.searchParams.get('url');
if (!data.name) data.name = currentUrl.searchParams.get('name');

sessionStorage.setItem('url', data.url || '');
sessionStorage.setItem('name', data.name || '');

history.replaceState({}, document.title, currentUrl.origin + currentUrl.pathname);


globalThis.addEventListener('click', function (ev) {
    if (ev.target.localName === 'a' && ev.target.getAttribute('href') === '#nop') return ev.preventDefault();
}, true);


function logerror(text = 'Unknown Error') {
    console.error(text);
    errorDetails.innerText = text;
    (!errorDlg.open) && errorDlg.showModal();
}


const form = document.getElementById('form');


let { newTask_allowPaste: enabledPaste = false } = await chrome.storage.local.get(['newTask_allowPaste']);
if (enabledPaste) {
    enablePaste.dataset.i18n = 'crTask_paste1';
    if (!data.url) setTimeout(() => enablePaste.click(), 100);
}
enablePaste.onclick = function (ev) {
    if (ev.shiftKey) {
        if (!confirm('Reset feature [newTask_allowPaste] ?')) return;
        chrome.storage.local.set({ newTask_allowPaste: null }, () => location.reload());
        return;
    }
    if (enabledPaste) {
        navigator.clipboard.readText().then((text) => {
            try {
                const url = new URL(text);
                dlink.value = url.href;
            } catch {
                if (ev.isTrusted) {
                    this.dataset.i18n = 'crTask_paste2';
                    setTimeout(() => this.dataset.i18n = 'crTask_paste1', 2000);
                }
            }
        }).catch(() => { });
    } else {
        chrome.storage.local.set({ newTask_allowPaste: true },
        () => {
            enabledPaste = true;
            enablePaste.dataset.i18n = 'crTask_paste1';
            setTimeout(() => enablePaste.click(), 100);
        });
    }
};


cancel.onclick = app.oncancel = () => chrome.tabs.getCurrent(({ id }) => { chrome.tabs.remove(id) });


dsave.onclick = function () {
    reloadSLCList().then(() => selectSaveLocationDlg.showModal());
};
dsave.addEventListener('keydown', function (ev) {
    if (ev instanceof KeyboardEvent && ev.key !== 'Enter') return;
    ev.preventDefault();
    ev.stopPropagation();
    return dsave.click();
}, true);
closeSLD.onclick = () => selectSaveLocationDlg.close();
selectSaveLocation.onclick = function () {
    window.showDirectoryPicker().then(async handle => {
        const random_name = (new Date().getTime()) + '_' + Math.floor(1e8 * Math.random()) + '.tmp';
        await handle.getFileHandle(random_name, { create: true });
        await handle.removeEntry(random_name);

        dsave.value = handle.name;
        dsave.real_value = handle;

        const random_id = (new Date().getTime()) + '_' + Math.floor(1e8 * Math.random());
        await userdata.put('entries', handle, random_id);
        dsave.entry_id = random_id;
        selectSaveLocationDlg.close();
        reloadSLCList();
    }).catch(() => { });
};
slcList.addEventListener('click', function (ev) {
    const loc = ev.target?.dataset?.loc;
    if (!loc) return;
    switch (loc) {
        case 'default':
            dsave.value = 'Default Location';
            dsave.real_value = undefined;
            dsave.entry_id = '0';
            break;
        
        case null:
        case undefined:
            break;
    
        default:
            return (async () => {
                const Loc = (loc === '0') ? 0 : loc;
                const handle = await userdata.get('entries', Loc);
                if (!handle) return;

                selectSaveLocationDlg.close();
                dsave.value = handle.name;
                dsave.real_value = handle;
                dsave.entry_id = loc;
            })();
    }
    selectSaveLocationDlg.close();
});
const reloadSLCList = async function () {
    const keys = await userdata.getAllKeys('entries')
    slcList_placeHolder.innerHTML = '';
    if (keys.length) slcList_placeHolder.append(document.createElement('hr'));
    for (const i of keys) {
        const value = await userdata.get('entries', i);
        const div = document.createElement('div');
        const a = document.createElement('a');
        a.href = '#nop';
        a.innerText = value.name;
        a.dataset.loc = a.title = i;
        a.translate = false;
        if (i === '0') a.prepend(document.createTextNode('[default] '));
        div.append(a);
        slcList_placeHolder.append(div);
    }
};

import { filter as filename_filter, test as filename_test } from '/ext/ftypes/filename_filter.js';
dname.oninput = function () {
    if (!filename_test(this.value)) {
        const s1 = this.selectionStart, s2 = this.selectionEnd;
        this.value = filename_filter(this.value);
        this.selectionStart = s1; this.selectionEnd = s2;
    }
};

document.getElementById('usesysdl').onchange = function (ev) {
    const checked = !!ev.target.checked;
    const formctl = form.querySelectorAll('.hide-in-sys-mode input');
    for (const i of formctl) {
        let flag = checked;
        // i.classList[flag ? 'add' : 'remove']('is-disabled');
        i.disabled = flag;
    }
};

sendnotify.onchange = async function () {
    this.disabled = true;
    if (!this.checked) {
        return this.disabled = false;
    }

    if (!await chrome.permissions.contains({ permissions: ['notifications'] })) {
        const granted = await chrome.permissions.request({ permissions: ['notifications'] });
        if (!granted) {
            this.checked = false;
            return this.disabled = false;
        }
    }
    return this.disabled = false;
};

if (data.url?.startsWith?.('ext://')) (
    (dlink.readOnly = enablePaste.disabled = true),
    [dlink, /*enablePaste*/].forEach(el => el.classList.add('is-disabled')),
    (form.classList.add('is-ext-mode')));



form.onsubmit = function (ev) {
    ev.preventDefault();
    ev.returnValue = false;

    const url = dlink.value;
    try {
        const url_test = new URL(url);
        void(url_test)
    } catch (error) {
        return logerror(error);
    }

    const usesysdl = document.getElementById('usesysdl'),
        usesysdl1 = document.getElementById('usesysdl1');
    if (usesysdl.checked) {
        if (url.startsWith('ext://')) {
            setTimeout(() => usesysdl.disabled = true, 4);
            usesysdl1.innerHTML = '<b>Error</b>: You cannot download [ext] links with system downloader.';
            return usesysdl.click();
        }
        submitBtn.disabled = true;
        return chrome.downloads.download({ url: url, filename: dname.value, conflictAction: 'uniquify' })
        .then(() => chrome.tabs.getCurrent(({ id }) => { chrome.tabs.remove(id) }))
        .catch(error => (logerror(error), submitBtn.disabled = false));
    }

    if (url.startsWith('ext://')) {
        submitBtn.disabled = true;
        const data = {
            url: dlink.value,
        };
        return chrome.runtime.sendMessage({
            from: 'page', type: 'get_ext_gateway_url', data
        }, resp => {
            if (!resp.success) {
                submitBtn.disabled = false;
                return alert('Error: ' + resp.text);
            }
            
            chrome.windows.create({
                focused: true,
                type: 'popup',
                url: resp.result,
                width: 640, height: 480,
            });
            chrome.tabs.getCurrent(({ id }) => { chrome.tabs.remove(id) });
        });
    }

    const filename = dname.value;
    if (!filename_test(filename)) {
        return logerror(new TypeError('Invalid **filename**'))
    }


    submitBtn.disabled = true;
    const resp = chrome.runtime.sendMessage({
        from: 'page', type: 'request_download',
        url: url, name: filename,
    });
    
    const oldText = submitBtn.innerHTML;
    resp.then(resp => {
        if (!resp.success) {
            if (true !== resp.needAction) {
                if (resp.text) throw resp.text;
                throw JSON.stringify(resp, null, 4);
            }
        }
        return resp;
    }).then(async resp => {
        const entry = (dsave.entry_id || '0');
        if (!await userdata.get('entries', entry)) {
            const { FilePicker } = await import('./static/FilePickerUI.js');
            const directorychooser = new FilePicker(FilePicker.TYPE_DIRECTORYPICKER);
            const handle = await directorychooser.pick({ access_Read: true, access_Write: true, text: chrome.i18n.getMessage('choosedefaultdownloaddirectory_text2') });
            // await userdata.put('entries', handle, 0);
            await userdata.put('entries', handle, '0');
        }
        return await chrome.runtime.sendMessage({
            from: 'page', type: 'request_download',
            url: url, name: filename,
            entryId: entry,
        });
    }).then(resp => {
        if (!resp.success) {
            if (true !== resp.needAction) {
                if (resp.text) throw resp.text;
                throw JSON.stringify(resp, null, 4);
            }
            setTimeout(() => submitBtn.click(), 20);
            return 'ENDCHAIN';
        }
        return resp.result;
    }).then(async resp => {
        if (resp === 'ENDCHAIN') return resp;
        const taskId = resp.taskId;
        const url = new URL('./eWidget-DownloadBottomBar.html', location.href);
        url.searchParams.set('taskId', taskId);
        const currentWindow =
            // await chrome.windows.getLastFocused({ windowTypes: ['normal'] }) ||
            await chrome.windows.getCurrent();

        await chrome.windows.create({
            type: 'popup',
            url: url.href,
            focused: true,
            left: currentWindow.left,
            top: currentWindow.top + currentWindow.height - 160,
            width: currentWindow.width,
            height: 160,
        });
        chrome.tabs.getCurrent(({ id }) => { chrome.tabs.remove(id) });
    }).catch(error => {
        logerror(error);
    }).finally(() => (submitBtn.disabled = false, submitBtn.innerHTML = oldText));
    submitBtn.innerText = 'Processing...';
};



// if (data.url?.startsWith?.('ext://')) setTimeout(() => form.dispatchEvent(new SubmitEvent('submit')), 200);
    
    


if (data.url) dlink.value = data.url;
if (data.name) dname.value = data.name;
dname.dispatchEvent(new InputEvent('input'));




app.showModal();


