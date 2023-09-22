const url = new URL(location.href);
const type = +url.searchParams.get('type');
const access = +url.searchParams.get('access');

if (isNaN(type) || isNaN(access) || access === 0) {
    debugger;
    await chrome.tabs.remove((await chrome.tabs.getCurrent()).id);
}

await import('./static/userdata.js');
const api = (type === 0) ?
    ((access & 0x2) ? window.showSaveFilePicker : window.showOpenFilePicker):
    (window.showDirectoryPicker);


const text = url.searchParams.get('text');
if (text) button.innerText = text;


if (window.opener) setInterval(() => {
    if (window.opener === null || window.opener.closed) {
        window.onbeforeunload = null
        chrome.tabs.getCurrent(({ id }) => { chrome.tabs.remove(id) })
    }
}, 200);



await new Promise(resolve => {
    button.onclick = resolve;
});


api().then(async resp => {
    if (type === 1 && access & 0x2) {
        const random_name = (new Date().getTime()) + '_' + Math.floor(1e8 * Math.random()) + '.tmp';
        await resp.getFileHandle(random_name, { create: true });
        await resp.removeEntry(random_name);
    }

    window.onbeforeunload = () => false;
    button.innerText = 'Please wait a bit...';
    const randomId = (new Date().getTime()) + '_' + Math.floor(1e8 * Math.random());
    await userdata.put('temp', resp, randomId);
    window.opener.postMessage({ from: 'eFilePicker-UI_frontend', id: url.searchParams.get('id'), value: randomId });
}).catch(error => {
    debugger
    window.onbeforeunload = null
    chrome.tabs.getCurrent(({ id }) => { chrome.tabs.remove(id) })
});


