

// console.log(chrome);


let findTitle = function (tag) {
    return tag.title || (function () {
        try {
            const url = new URL(tag.src, location.href);
            const filename = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
            return filename;
        } catch { return 'File' }
    }());
};


chrome.runtime.onConnect.addListener(function (port) {
    port.onMessage.addListener((request) => {
        switch (request.type) {
            case 'queryResources':
                {
                    const medias = document.querySelectorAll('audio,video');
                    const result = [];
                    const executeInvoker = i => {
                        if (i.src) result.push({
                            type: i.tagName.toLowerCase(),
                            url: i.src,
                            title: findTitle(i),
                        });
                    };
                    for (let i of medias) {
                        if (!i.src) {
                            let ii = i.querySelectorAll('source');
                            if (ii.length) ii.forEach(executeInvoker);
                        }
                        executeInvoker(i);
                    }
                    port.postMessage({
                        eventId: request.eventId,
                        result
                    });
                }
                break;
    
            default: ;
        }
    });
});

