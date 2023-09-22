const url = new URL(location.href);
const
    // aid = url.searchParams.get('aid'), // 此接口不能使用av号
    cid = url.searchParams.get('cid'),
    bvid = url.searchParams.get('bvid'),
    dname = url.searchParams.get('name') || '';

if (!cid || !(bvid)) {
    close();
}

function log(text) {
    const date = new Date();
    const gt = `[${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.${date.getMilliseconds()}] ${text}`;
    const div = document.createElement('div');
    div.innerText = gt;
    progress.prepend(div);
}


log(`bvid=${bvid},cid=${cid}`);
// history.replaceState({}, document.title, url.pathname);


const playurl = new URL('https://api.bilibili.com/x/player/playurl?platform=html5&high_quality=1');
playurl.searchParams.set('cid', cid);
playurl.searchParams.set('bvid', bvid);
log('GET ' + playurl + ' [1/2]');
let data = null;
try {
    const resp = await(await fetch(playurl, { credentials: 'include' })).json();
    log('response received:\n' + JSON.stringify(resp, null, 2));
    if (resp.code !== 0) throw resp;
    data = resp.data;
} catch (error) {
    log('error: ' + ((error instanceof Error) ? (error.stack || error) : ((error instanceof Object) ? JSON.stringify(error, null, 4) : String(error))));
    log('ERROR');
    throw stop()
}

if (!(data?.accept_quality?.length)) {
    log('[1] No data found, please retry');
    log('ERROR');
    throw stop();
}
log('support_formats=' + JSON.stringify(data.support_formats, null, 4));
log('accept_quality=' + data.accept_quality.join(','));

progress.prepend(document.createElement('hr'));
log('waiting for user');
const use_quality = await new Promise(function (resolve, reject) {
    param_q.querySelector('button[type=reset]').onclick = () => window.close();
    for (const i of data.support_formats) {
        const el = document.createElement('option');
        el.value = i.quality;
        el.innerText = i.new_description;
        qualities.append(el);
    }
    param_q.querySelector('form').onsubmit = (ev) => {
        const val = qualities.value;
        if (!val) return (ev.preventDefault() && false);

        resolve(val);
    };
    param_q.showModal();
})//Math.max.apply(Math, data.accept_quality);
log('use quality: ' + use_quality);
progress.prepend(document.createElement('hr'));

playurl.searchParams.set('qn', use_quality);
log('GET ' + playurl + ' [2/2]');

try {
    const resp = await(await fetch(playurl, { credentials: 'include' })).json();
    log('response received:\n' + JSON.stringify(resp, null, 2));
    if (resp.code !== 0) throw resp;
    data = resp.data;
} catch (error) {
    log('error: ' + ((error instanceof Error) ? (error.stack || error) : ((error instanceof Object) ? JSON.stringify(error, null, 4) : String(error))));
    log('ERROR');
    throw stop()
}

const durl = data.durl?.[0]?.url;
if (!durl) {
    log('[2] No data found, please retry');
    log('ERROR');
    throw stop();
}
log('current quality= ' + data.quality);
log('download url: ' + JSON.stringify(data.durl, null, 4));



progress.prepend(document.createElement('hr'));
log('testing download url');
log('HEAD ' + durl);
import mimeTypes from '/ext/ftypes/MIME.js';
let extname = '';
try {
    const resp = (await fetch(durl, { credentials: 'include', method: 'HEAD' }));
    log('response received');
    log('status=' + resp.status);
    if (!resp.ok) throw resp;
    log('MIME type= ' + resp.headers.get('content-type'));
    log('size=' + resp.headers.get('content-length'));
    extname = '.' + (mimeTypes[resp.headers.get('content-type')] || 'mp4');
    log('extname=' + extname);
} catch (error) {
    log('error: ' + ((error instanceof Error) ? (error.stack || error) : ((error instanceof Object) ? JSON.stringify(error, null, 4) : String(error))));
    log('ERROR');
    throw stop()
}




progress.prepend(document.createElement('hr'));
log(durl); log('Download URL:');
progress.prepend(document.createElement('hr'));

await new Promise(r => setTimeout(r, 1000));
log('invoke downloader');
await chrome.runtime.sendMessage({
    from: 'page',
    type: 'create_task',
    url: durl, filename: (dname || '') + extname,
});


history.replaceState({}, document.title, url.pathname);


let closetimer = 31;
setInterval(() => {
    --closetimer;
    log('This window will be closed in ' + closetimer + ' seconds' + ('.'.repeat(closetimer < 1 ? 1 : closetimer)));
    if (closetimer < 0) {
        chrome.tabs.getCurrent(({ id }) => { chrome.tabs.remove(id) });
    }
    
}, 1000);

