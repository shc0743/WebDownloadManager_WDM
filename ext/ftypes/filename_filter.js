const { os } = await chrome.runtime.getPlatformInfo();
export const pattern = (os === 'win') ?
    /([\\\/\:\*\?"\<\>\|]|(^aux$|^con$|^com[0-9]$|^nul$))/ig : // windows
    /([\/\\])/ig; // unix | linux | mac
    
    
// test
// returns **true** if **filename** is valid; otherwise returns **false**.
export function test(filename = '') {
    if ((typeof filename !== 'string')) throw new TypeError('ERROR_INVALID_PARAMETER');
    return !pattern.test(filename) && !!filename;
};

// filter
// returns a string which replaced the invalid part in **filename** with **replacer**.
// returns an empty string if ** filename ** is all invalid.
export function filter(filename = '', replacer = '_') {
    if ((typeof filename !== 'string') || (typeof replacer !== 'string')) throw new TypeError('ERROR_INVALID_PARAMETER');
    return filename.replace(pattern, (substring) => {
        return replacer.repeat(substring.length);
    });
};

