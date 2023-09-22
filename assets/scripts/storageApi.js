globalThis.storage = new Proxy({
    async get(key = '') {
        return (await chrome.storage.local.get([key]))[key];
    },
    async set(key = '', value = {}) {
        return (await chrome.storage.local.set({ [key]: value }));
    },

}, {
    get(target, p, receiver) {
        if (p in target) return Reflect.get(target, p, receiver);
        return target.get(p);
    },
    set(target, p, newValue, receiver) {
        if (p in target) throw new SyntaxError('Access denied');
        return target.set(p, newValue);
        return Reflect.set(target, p, value, receiver);
    },
});

