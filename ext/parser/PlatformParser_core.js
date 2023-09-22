

// imports start
import { parse_bilibili } from './parse_bilibili.js';
// imports end


const site_features = {
    async 'www.bilibili.com'(url) {
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
    async 'b23.tv'(url) {
        const resp = await fetch(url, { credentials: 'include', mode: 'cors' });
        const text = (await resp.text()).trim();
        if (text.startsWith('<a href="')) {
            // const loc = resp.headers.get('Location'); // the Location header is removed by us, so use another way to parse
            const loc = text.substring(text.indexOf('"') + 1, text.lastIndexOf('">Found'));
            // console.log('parsed:',loc);
            return parse(loc);
        }

        return [];
    },
};

export const parse = (async function (url) {
    const newUrl = new URL(url);
    const domain = newUrl.hostname;
    if (domain in site_features) return await site_features[domain].call(this, newUrl);

    return [];
});








