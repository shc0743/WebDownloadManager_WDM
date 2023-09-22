globalThis.my_infinite_promise = new Promise(function () {});

{
    const url = location.origin + location.pathname;
    history.replaceState({}, '', url);
    const tabs = await chrome.tabs.query({ url: url });
    const { id: currentId } = await chrome.tabs.getCurrent();
    if (tabs[1]) for (const i of tabs) {
        if (i.id === currentId || (await chrome.windows.get(i.windowId)).type !== 'popup') continue;
        await chrome.tabs.update(i.id, { active: true });
        await chrome.windows.update(i.windowId, { focused: true });
        await chrome.tabs.remove(currentId);
        await globalThis.my_infinite_promise;
    }
}

if ((await chrome.windows.getCurrent())?.type !== 'popup') {
    await chrome.windows.create({ url: location.href, type: 'popup', width: 1024, height: 768 });
    chrome.tabs.getCurrent(({ id }) => { chrome.tabs.remove(id) });
    await globalThis.my_infinite_promise;
}





// settings items

const ctx_menu_options = (await chrome.storage.local.get(['ctx_menu'])).ctx_menu;
(ctx_menu_options === 'enhanced') ? (s_cx2.checked = true) : (
(ctx_menu_options === true) ? (s_ctx.checked = true) : (s_noctx.checked = true)
);
s_noctx.onchange = s_ctx.onchange = s_cx2.onchange = async function () {
    this.disabled = true;
    if (this.id === 's_noctx') {
        const result = await chrome.runtime.sendMessage({
            from: 'page', type: 'set_ctx_menu',
            data: { enabled: false },
        });
        if (!(result?.success)) this.checked = true;
        return this.disabled = false;
    }

    const result = await chrome.runtime.sendMessage({
        from: 'page', type: 'set_ctx_menu',
        data: { enabled: true },
        enhanced: (this.id === 's_cx2'),
    });
    if (!(result?.success)) console.warn(this.checked = false, result);
    return this.disabled = false;
};

s_etf.checked = await chrome.permissions.contains({ permissions: ['notifications'] });
s_etf.onchange = async function () {
    this.disabled = true;
    if (!this.checked) {
        await chrome.permissions.remove({ permissions: ['notifications'] });
        return this.disabled = false;
    }

    const granted = await chrome.permissions.request({ permissions: ['notifications'] });
    if (!granted) {
        this.checked = false;
        return this.disabled = false;
    }
    return this.disabled = false;
};

s_tps.checked = await chrome.permissions.contains({ permissions: ['topSites'] });
s_tps.onchange = async function () {
    this.disabled = true;
    if (!this.checked) {
        await chrome.permissions.remove({ permissions: ['topSites'] });
        return this.disabled = false;
    }

    const granted = await chrome.permissions.request({ permissions: ['topSites'] });
    if (!granted) {
        this.checked = false;
        return this.disabled = false;
    }
    return this.disabled = false;
};

s_bkg.checked = await chrome.permissions.contains({ permissions: ['background'] });
s_bkg.onchange = async function () {
    this.disabled = true;
    if (!this.checked) {
        await chrome.permissions.remove({ permissions: ['background'] });
        return this.disabled = false;
    }

    const granted = await chrome.permissions.request({ permissions: ['background'] });
    if (!granted) {
        this.checked = false;
        return this.disabled = false;
    }
    return this.disabled = false;
};

s_clr.onchange = async function () {
    this.disabled = true;
    const granted = confirm('Are you sure you want to do this? \nThe operation CANNOT be undo!!\n\nYou\'ll lost ALL configs and datas in the extension.\n\nAfter you deleted data, the extension will be restarted.');
    if (!granted) {
        this.checked = false;
        return this.disabled = false;
    }
    // await chrome.storage.sync.clear();
    await chrome.storage.local.clear();

    await chrome.runtime.reload();
    return globalThis.location.reload();
};
s_clr2.onchange = async function () {
    this.disabled = true;
    const granted = confirm('Are you sure you want to do this? \nThe operation CANNOT be undo!!\n\nYou\'ll lost ALL databases in the extension.\n\nAfter you deleted data, the extension will be restarted.');
    if (!granted) {
        this.checked = false;
        return this.disabled = false;
    }
    
    const db = await window.indexedDB.databases();
    for (const i of db) {
        await new Promise((resolve, reject) => {
            const req = window.indexedDB.deleteDatabase(i.name);
            req.onsuccess = resolve;
            req.onerror = reject;
        });
    }

    await chrome.runtime.reload();
    return globalThis.location.reload();
};

s_eap.onchange = async function () {
    this.disabled = true;
    const granted = await chrome.permissions.request({ permissions: ['notifications', 'topSites', 'background'] });
    if (!granted) {
        this.checked = false;
        return this.disabled = false;
    }
    return globalThis.location.reload();
};


dl_location_choose.onclick = function () {
    window.showDirectoryPicker().then(async handle => {
        
        const random_name = (new Date().getTime()) + '_' + Math.floor(1e8 * Math.random()) + '.tmp';
        await handle.getFileHandle(random_name, { create: true });
        await handle.removeEntry(random_name);

        dl_location.value = handle.name;
        // await userdata.put('entries', handle, 0);
        await userdata.put('entries', handle, '0');
    }).catch(() => { });
};
userdata.get('entries', '0').then((handle) => {
    if (handle) {
        dl_location.value = handle.name;
    } else {
        dl_location.value = '<unset>';
    }
}).catch(() => { });
dl_location_clear.onclick = function () {
    userdata.delete('entries', '0');
    dl_location.value = '<unset>';
};
openSysDlLoc.onclick = function () {
    chrome.downloads.showDefaultFolder()
};

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
import './static/userdata.js';
slcList_load.onclick = reloadSLCList;
slcList_clear.onclick = async function () {
    this.disabled = true;
    const keys = await userdata.getAllKeys('entries')
    for (const i of keys) {
        await userdata.delete('entries', i);
    }
    reloadSLCList();
    this.disabled = false;
}
slcList_placeHolder.addEventListener('click', ev => {
    if (ev.target?.getAttribute?.('href') !== '#nop') return;
    ev.preventDefault();
    userdata.get('entries', ev.target.dataset.loc).then(success => {
        if (!success) throw 0;
        return userdata.delete('entries', ev.target.dataset.loc);
    }).then(() => {
        ev.target.remove();
    }).catch(() => { });
}, true);




reload.onclick = function () {
    if (confirm(this.innerText + '?')) chrome.runtime.reload();
}
uninstallSelf.onclick = function () {
    if (!this.$data) {
        if (confirm(chrome.i18n.getMessage('uninstallSelfPrompt')))
            (this.$data = true), (this.innerText = 'Confirm Uninstall');
        return;
    }

    chrome.management.uninstallSelf({ showConfirmDialog: false });
}









