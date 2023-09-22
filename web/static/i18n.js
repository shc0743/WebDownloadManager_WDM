/*
i18n.js
    chrome extension - i18n client tool

License: [MIT License](https://mit-license.org)
Author: [shc0743](https://github.com/shc0743/)

Usage: 
    1. add the following code into your HTML file:
        <script type="module" src="./your/path/to/i18n.js"></script>
    2. set up i18n locale file (for more information, see https://developer.chrome.com/docs/extensions/reference/i18n/#)
    3.
        Use these code in your HTML to insert i18n string:
            <span data-i18n="i18nKey"></span>
        Use these code in your HTML to insert i18n HTML:
            <span data-i18n-html="i18nKey"></span>
        Use these code in your HTML to set element `title` attribute:
            <span data-i18n-title="i18nKey"></span>
        Use these code in your HTML to set element `aria-label` attribute:
            <span data-i18n-aria-label="i18nKey"></span>
        Use these code in your HTML to set element `value` attribute:
            <span data-i18n-value="i18nKey"></span>
        You can also use JavaScript DOM API to edit them:
            <!--html--><span id=test1 data-i18n="i18nKey1"></span>
            /~javascript~/document.getElementById('test1').dataset.i18n = 'i18nKey2'
*/


const propName = {
    'data-i18n': 'innerText',
    'data-i18n-html': 'innerHTML',
    'data-i18n-title': 'title',
    'data-i18n-aria-label': 'ariaLabel',
    'data-i18n-value': 'value',
};
const attrs = Reflect.ownKeys(propName);

function cb0(data) {
    for (const i of data) {
        // 判断属性名称
        if (!attrs.includes(i.attributeName)) continue;
        const value = i.target.getAttribute(i.attributeName);
        if (!value) continue;
        i.target[propName[i.attributeName]] = chrome.i18n.getMessage(value);
    }
}

export const observer = new MutationObserver(cb0);

observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: attrs,
    subtree: true,
});

document.querySelectorAll(attrs.map(el => `[${el}]`).join(',')).forEach(el => {
    for (const i of attrs) {
        if (el.getAttribute(i) != null) cb0([{ attributeName: i, target: el }]);
    }
});


if (!Reflect.has(globalThis, 'i18n')) Object.defineProperty(globalThis, 'i18n', {
    value() { return chrome.i18n.getMessage.apply(chrome.i18n, arguments) },
    writable: true,
    enumerable: true,
    configurable: true,
});


