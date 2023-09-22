// This file is deprecated and will no longer use in the project.
// [2023-07-20]

const currentDomain = location.hostname;
const applyToDomains = [
    'www.bilibili.com',
];
const site_features = {
    async 'www.bilibili.com'() {
        const url = new URL(location.href)
        const sp_bvid = url.searchParams.get('bvid');
        const sp_aid = url.searchParams.get('aid');
        if (sp_bvid) return await parse_bilibili(sp_bvid, true);
        if (sp_aid) return await parse_bilibili(sp_aid);
        const url_array = url.pathname.split('/').filter(el => !!el);
        for (let i = 0, l = url_array.length; i < l; ++i) {
            if (url_array[i] === 'video' && i + 1 < l) return await parse_bilibili(url_array[i + 1], /^BV/i.test(url_array[i + 1]));
            if (url_array[i].startsWith('BV')) return await parse_bilibili(url_array[i], true);
        }

        return [];
    },
};
if ((applyToDomains.includes(currentDomain)))
(function (domain) {
    console.info('[content]', '[PlatformParser]', 'platform parser is running in the site');


    chrome.runtime.onConnect.addListener(function (port) {
        port.onMessage.addListener(async (request) => {
            switch (request.type) {
                case 'queryResources':
                    port.postMessage({
                        eventId: request.eventId,
                        result: await site_features[domain].call(this, request),
                    });
                    break;

                default: ;
            }
        });
    });




})(currentDomain);




async function parse_bilibili(aid, isBVID = false) {
    if (/^av[0-9]*$/i.test(aid)) aid = aid.substring(2);
    const view = await (await fetch('https://api.bilibili.com/x/web-interface/view?' + (isBVID ? 'bvid=' : 'aid=') + aid, { credentials: 'include' })).json();
    if (!view.data) return [];
    const result = [];
    const title = view.data.title, uploader = view.data.owner.name;
    const hasOnly1Page = (view.data.pages.length < 2);
    for (const i of view.data.pages) {
        result.push({
            type: 'video',
            filename_suffix: '.mp4',
            url: 'ext://downloader/bilivideo?' + (isBVID ? 'bvid=' : 'aid=') + aid + '&cid=' + i.cid,
            title: hasOnly1Page ? title : `${i.page}P. ${i.part} - ${title}`,
            customInfo: `UP主: ${uploader}\nav号: av${view.data.aid}\nBV号: ${view.data.bvid}\n时长: ${i.duration}秒\n分P标题: ${i.part}`,
        });
    }
    return result;
}



