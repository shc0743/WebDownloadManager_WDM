export async function parse_bilibili(aid, isBVID = false) {
    if (/^av[0-9]*$/i.test(aid)) aid = aid.substring(2);
    const view = await (await fetch('https://api.bilibili.com/x/web-interface/view?' + (isBVID ? 'bvid=' : 'aid=') + aid, { credentials: 'include', mode: 'cors' })).json();
    if (!view.data) return [];
    const result = [];
    const title = view.data.title, uploader = view.data.owner.name;
    const hasOnly1Page = (view.data.pages.length < 2);
    for (const i of view.data.pages) {
        const title2 = hasOnly1Page ? title : `${i.page}P. ${i.part} - ${title}`;
        const url = new URL('ext://downloader/bilivideo');
        url.searchParams.set('bvid', view.data.bvid);
        url.searchParams.set('cid', i.cid);
        url.searchParams.set('name', title2);

        result.push({
            type: 'video',
            filename_suffix: '.mp4',
            url: url.href, title: title2,
            customInfo: `UP主: ${uploader}\nav号: av${view.data.aid}\nBV号: ${view.data.bvid}\ncid: ${i.cid}\n时长: ${i.duration}秒\n分P标题: ${i.part}`,
        });
    }
    return result;
}


