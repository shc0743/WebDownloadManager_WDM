
document.getElementById('loading_page').oncancel = () => false;
document.getElementById('loading_page').showModal();


function delay(time = 0) { return new Promise(resolve => setTimeout(resolve, time)) }



document.title = await chrome.i18n.getMessage('extName');


document.getElementById('app').oncancel = () => false;
document.getElementById('app').showModal();
document.getElementById('loading_page').close();


await delay(10);



document.getElementById('loading_page').showModal();

// await delay(150 + ((new Date().getTime()) % 350));
await delay(50 + ((new Date().getTime()) % 50));

const objectStoreName = (function () {
    const url = new URL(globalThis.location.href);
    const oss = url.searchParams.get('objectStore');
    if (typeof oss === 'string' && (!!oss)) return oss;
    return 'taskStorage0'; // default value
}());

// const { ElDialog, ElMessage } = await import('/lib/element-plus/index.full.mjs.js');


await delay(10);

import '../assets/scripts/storageApi.js';
import { INIT as Zuserdata2_init } from '../assets/scripts/userdata.js';
import { TaskManager } from '../context/download-core/Task.js';
await Zuserdata2_init;
const taskManager = new TaskManager();
taskManager.init(globalThis.userdata2, objectStoreName);
await taskManager.INIT;

function shortify(str, maxLength) {
    return (str?.length > maxLength ? str.substring(0, (maxLength) - 1) + '…' : str)
}
function createCell(element, text = '', isHTML = false, {
    ellipsis = false,
    ellipsisMaxLength = 0,
} = {}) {
    const div = document.createElement('div');
    div.className = 'cell';
    if (isHTML) {
        div.innerHTML = text;
    } else if (ellipsis) {
        div.tabIndex = 0;
        if (text.length > ellipsisMaxLength) {
            const p = text.substring(0, ellipsisMaxLength - 1);
            div.append(document.createTextNode(p));
            const el = document.createElement('span');
            el.style.userSelect = 'none';
            el.append('…');
            div.append(el);
        } else {
            div.innerText = text;
        }

        let _norepeat = false;
        const select = () => {
            const node = div._node || div;
            const selection = window.getSelection();
            if (selection.rangeCount > 0) selection.removeAllRanges();
            const range = document.createRange();
            range.selectNode(node);
            selection.addRange(range);
        };
        const exec = () => {
            if (_norepeat) return;
            _norepeat = true;
            const oldHTML = div.innerHTML;
            const node = document.createTextNode(text);
            div.innerHTML = '';
            div.append(node);
            div._node = node;
            div.focus();

            div.addEventListener('blur', () => {
                div.innerHTML = oldHTML;
                delete div._node;
                _norepeat = false;
            }, { once: true });
        };
        div.addEventListener('click', ev => {
            ev.stopPropagation();
            select();
        });
        div.addEventListener('keydown', ev => {
            if (ev.key === 'Enter') exec();
        });
        div.addEventListener('contextmenu', select);
        div.addEventListener('pointerdown', exec);
    } else {
        div.innerText = text;
    }
    element.append(div);
    return div;
}
function createElButton(text, {
    id = null,
    type = null,
    dataset = null,
} = {}) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'el-button';
    if (type) btn.classList.add('el-button--' + type, 'is-plain');
    if (id) btn.id = id;
    if (dataset) for (const i in dataset) btn.dataset[i] = dataset[i];

    btn.innerText = text;

    return btn;
}

const cached_entries_name = new Map();
globalThis.data_pager_page_size = 20;

// let lastAppPagerCursor = -1;
document.getElementById('app_pager').onchange = (function (ev) {
    if (!ev.detail?.isUser) return;
    // if (this.value === lastAppPagerCursor) return;
    // lastAppPagerCursor = this.value;
    updateTaskList((this.value - 1) * globalThis.data_pager_page_size);
});

async function updateTaskList(begin = 0) {
    download_data.innerHTML = '';
    const app_pager_blocker = ev => !!(ev.preventDefault() && false);
    document.getElementById('app_pager').addEventListener('beforechange', app_pager_blocker);


    let count = await userdata2.count(objectStoreName);
    // const pages = Math.max(1, Math.floor(count / pager_pageSize));
    document.getElementById('app_pager').count = count,
    document.getElementById('app_pager').pageSize = globalThis.data_pager_page_size;


    try {
        let tx = userdata2.transaction(objectStoreName);
        let cursor = await tx.store.openCursor(undefined, 'prev'), n = 0;
        try {
            begin && (await cursor.advance(begin));
        } catch { begin = globalThis.data_pager_page_size }

        while (cursor && (n++ < globalThis.data_pager_page_size)) {
            payload(cursor.value);
            try { cursor = await cursor.continue(); }
            catch { break; }
        }
    } catch (error) { console.error('Unexpected error in updateTaskList:', error); }

    document.getElementById('app_pager').removeEventListener('beforechange', app_pager_blocker);



    function payload(i) {
        if (isNaN(i.id)) return;

        const el = document.createElement('tr');
        el.className = 'el-table__row my-table-data_row';
        el.dataset.id = i.id;
        
        const td0 = document.createElement('td');
        const td0_inner = createCell(td0);
        el.append(td0);

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        if (download_data__checkAll.checked) checkbox.checked = true;
        td0_inner.append(checkbox);
        
        const td1 = document.createElement('td');
        createCell(td1, i.id);
        el.append(td1);
        
        const td2 = document.createElement('td');
        createCell(td2, i.filename, false, { ellipsis: true, ellipsisMaxLength: 240 });
        el.append(td2);
        
        const td3 = document.createElement('td');
        const td3_runner = (result) => {
            const td3_inner = createCell(td3, result.name, false, { ellipsis: true, ellipsisMaxLength: 25 });
            td3.title = result.name;
        };
        if (cached_entries_name.has(i.entryId)) {
            const result = cached_entries_name.get(i.entryId);
            td3_runner(result);
        }
        else userdata.get('entries', i.entryId).then(result => {
            if (!result) return;
            cached_entries_name.set(i.entryId, result);
            td3_runner(result);
        });
        el.append(td3);
        
        const td4 = document.createElement('td');
        createCell(td4, i.status);
        el.append(td4);
        
        const td5 = document.createElement('td');
        createCell(td5, i.progress);
        el.append(td5);

        const td6 = document.createElement('td');
        createCell(td6, i.url, false, { ellipsis: true, ellipsisMaxLength: 60 });
        td6.title = i.url;
        el.append(td6);

        const td7 = document.createElement('td');
        createCell(td7, new Date(i.time).toLocaleString().replace(' ', '\n'));
        td7.title = `UNIX_Timestamp= ${Math.floor(i.time/1000)}\nJavaScript_Time= ${(i.time)}`;
        el.append(td7);

        const td8 = document.createElement('td');
        const td7_inner = createCell(td8);
        td7_inner.classList.add('my-table--flex-content', 'always-wrap');
        el.append(td8);

        td7_inner.append(createElButton('Details', { type: 'primary', dataset: { action: 'open' } }));
        // td7_inner.append(createElButton('Delete', { type: 'danger', dataset: { action: 'delete' } }));


        [td0, td1, td2, td3, td4, td5, td6, td7, td8].forEach(td => td.classList.add('el-table__cell'));
        

        download_data.append(el);
    }
}

updateTaskList();


import { TickManager } from '/assets/scripts/TickManager.js';

{
    const tickManager = new TickManager(500);
    let clearer = null;
    chrome.storage.onChanged.addListener((ev) => {
        if ('taskShouldUpdate' in ev) {
            if (typeof clearer === 'function') clearer();
            clearer = tickManager.nextTick(() => {
                document.getElementById('loading_page').showModal()
                // document.getElementById('app_pager').value = 1
                // updateTaskList().then(() => document.getElementById('loading_page').close());
                updateTaskList((document.getElementById('app_pager').value - 1) * globalThis.data_pager_page_size).then(() => {
                    document.getElementById('loading_page').close();
                });
            });
        }
    });
}


import('./index.html.keyboard_shortcuts.js').then((moduleHandle) => {
    const { default: ks, NoPrevent } = moduleHandle;
    globalThis.addEventListener('keydown', function (ev) {
        const keys = [];
        if (ev.ctrlKey && ev.key !== 'Control') keys.push('Ctrl');
        if (ev.altKey && ev.key !== 'Alt') keys.push('Alt');
        if (ev.shiftKey && ev.key !== 'Shift') keys.push('Shift');
        keys.push(ev.key.length === 1 ? ev.key.toUpperCase() : ev.key);
        const key = keys.join('+');

        const fn = ks[key];
        if (fn) {
            const ret = fn.call(globalThis, ev, key);
            if (ret !== NoPrevent) ev.preventDefault();
        }
        return;
    });
});



download_data.addEventListener('click', function (ev) {
    let target = ev.target;
    if (!target) return;
    if (/^(input|button|a)$/i.test(target.tagName)) return;
    do {
        if (target.tagName?.toLowerCase?.() === 'tr' && target.classList?.contains?.('my-table-data_row')) {
            target.querySelector('input[type=checkbox]').click();
            break;
        }
    } while ((target = target.parentNode) != null);
});
{
    let is_executing = false;
    download_data.addEventListener('change', function (ev) {
        let target = ev.target;
        if (!target) return;
        if (/^(input)$/i.test(target.tagName) == false || target.type !== 'checkbox') return;
    
        if (!is_executing) {
            const hasUnchecked = !!(download_data.querySelector('input:not(:checked)'));
            if (download_data__checkAll.checked && hasUnchecked) {
                download_data__checkAll.checked = false;
            }
        }
    });
    download_data__checkAll.onchange = function () {
        const check = this.checked;
        is_executing = this.disabled = true;
        const hasUnchecked = !!(download_data.querySelector('input:not(:checked)'));
        for (const el of download_data.querySelectorAll('input[type=checkbox]')) {
            if (el.checked === check) continue;
            el.click();
        }
        if (hasUnchecked) this.checked = false;
        try { if (this.checked) {
            download_data__checkAll_popover.showPopover();
        } else {
            download_data__checkAll_popover.hidePopover();
        } } catch {}
        is_executing = this.disabled = false;
    };
}


await delay(10);
setTimeout(async function () {
    const url = new URL(globalThis.location.href);
    let hash = url.hash;
    if (!hash.startsWith('#/')) return;
    hash = hash.substring(2);

    const command = hash.substring(0, hash.indexOf('@'));
    switch (command) {
        case '=': {
            const param = +hash.substring(2);
            if (isNaN(param)) return;
            const data_exists = !!(await userdata2.get(objectStoreName, param));
            if (!data_exists) {
                logerror('Invalid command  ' + command);
                break;
            }

            await delay(10);
            document.getElementById('loading_page').showModal();


            let count = await userdata2.count(objectStoreName);
            const pages = Math.max(1, Math.ceil(count / globalThis.data_pager_page_size));
            document.getElementById('app_pager').count = count,
                document.getElementById('app_pager').pageSize = globalThis.data_pager_page_size;
            for (let n = 1; n <= pages; ++n) {
                document.getElementById('app_pager').value = n;
                let begin = (n - 1) * globalThis.data_pager_page_size;
                if (!(await (async function (begin) {
                    try {
                        let tx = userdata2.transaction(objectStoreName);
                        let cursor = await tx.store.openCursor(undefined, 'prev'), n = 0;
                        try {
                            begin && (await cursor.advance(begin));
                        } catch { begin = globalThis.data_pager_page_size }

                        while (cursor && (n++ < globalThis.data_pager_page_size)) {
                            if (cursor.value.id === param) {
                                return true;
                            }
                            try { cursor = await cursor.continue(); }
                            catch { break; }
                        }
                    } catch (error) { console.error('Unexpected error in updateTaskList:', error); }
                })(begin))) {
                    continue;
                }

                await updateTaskList(begin);

                const el = download_data.querySelector('[data-id="' + param + '"]');
                if (!el) break;
                el.scrollIntoView({ behavior: 'smooth' });
                el.classList.add('my-strong-tip');
                break;
            }

            document.getElementById('loading_page').close();

        }
            break;
    
        default: {
            const dialog = document.createElement('dialog');
            dialog.oncancel = () => dialog.remove();
            dialog.innerHTML = 'Unknown Command: ';
            dialog.append(document.createTextNode(command));
            dialog.append(document.createElement('hr'));
            const a = document.createElement('button');
            a.onclick = () => { dialog.close(); dialog.remove() };
            a.append('OK');
            dialog.append(a);
            document.body.append(dialog);
            dialog.showModal();
            return;
        }
            break;
    }
    const url2 = new URL(url);
    url2.search = url2.hash = '';
    history.replaceState({}, document.title, url2);
});




document.getElementById('generate_test_data').onclick = async function (ev) {
    this.disabled = true;
    let current = 8589934592;
    if (ev.shiftKey) {
        this.innerText = ('Deleting...');
        for (const max = current + 10000; current < max; ++current) {
            await userdata2.delete(objectStoreName, current);
        }
        this.append(' Done.');
        return updateTaskList();
    }
    this.innerText = ('Start Generating    10,000 datas    begin=' + current + ' time=' + (new Date().toLocaleString()));
    for (const max = current + 10000; current < max; ++current) {
        await userdata2.put(objectStoreName, {
            id: current,
            url: (current % 2 ? 'test-url-scheme://test-server.com/test-path/serve-file/@' : 'https://example.com/@serve-file/') + current,
            filename: 'myfile' + current + '.bin',
            status: 'Unstarted',
            progress: '12.3456%',
            time: (new Date().getTime()),
            entryId: '0',
        });
    }
    this.append(document.createElement('br'));
    this.append('Generate Done    10,000 datas    end=' + current + ' time=' + (new Date().toLocaleString()));

    updateTaskList();
}



function logerror(text = 'Unknown Error') {
    console.error(text);
    errorDetails.innerText = text;
    (!errorDlg.open) && errorDlg.showModal();
}



(import('/assets/defs/index.js').then(module => {
    for (const i of Reflect.ownKeys(module)) {
        // console.log(i);
        if (typeof i !== 'string') continue;
        globalThis[i] = module[i];
    }
}));




taskOperations.addEventListener('click', function (ev) {
    const op = ev.target?.dataset?.taskAction;
    if (!op) return;
    const optValue = globalThis['TASK_STATE_TO_' + op.toUpperCase()];
    if (!optValue) return;

    document.getElementById('loading_page').showModal();

    const checkAll = !!download_data__checkAll.checked;
    const chosen = checkAll ? 'all' : [];
    if (!checkAll) for (const i of download_data.querySelectorAll('input:checked')) {
        const id = i.parentElement.parentElement.parentElement.dataset.id;
        if (id && (!isNaN(+id))) chosen.push(+id);
    }

    chrome.runtime.sendMessage({
        from: 'app', type: 'set_download_task_state',
        influences: chosen,
        newState: optValue,
    }).then(resp => {
        if (!resp.success) throw resp;

        
    }).catch(error => {
        logerror('Failed to process your request: ' + JSON.stringify(error, null, 2));
    }).finally(() => document.getElementById('loading_page').close());
    
});







document.getElementById('loading_page').close();



