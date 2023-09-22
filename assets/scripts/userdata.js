

// config
export const db_name = 'WebDownloadManager_service-data';
export const version = 2;


import { openDB } from '/lib/idb/idb.esm.js';





const dbUpgrade = {
    0(db, t, old) {
        db.createObjectStore('config', { autoIncrement: true });
        db.createObjectStore('cache', { autoIncrement: true });
        db.createObjectStore('temp', { autoIncrement: true });

    },
    1(db, t, old) {
        db.createObjectStore('taskStorage0', { keyPath: 'id' });
        db.createObjectStore('taskStorage1', { keyPath: 'id' });
        db.createObjectStore('taskInternal0', { autoIncrement: true });
        db.createObjectStore('taskInternal1', { autoIncrement: true });

    },
};


let db;
export const INIT = new Promise(function (resolve, reject) {
    openDB(db_name, version, {
        upgrade(db, oldVersion, newVersion, transaction, event) {
            for (let version = oldVersion; version < newVersion; ++version) {
                if (dbUpgrade[version]) {
                    const _ = dbUpgrade[version].call(db, db, transaction, oldVersion);
                }
            }
        },
        blocked(currentVersion, blockedVersion, event) {
            reject(`Failed to open database ${db_name}: blocked: currentVersion = ${currentVersion}, blockedVersion = ${blockedVersion}`)
        },
        blocking(currentVersion, blockedVersion, event) {
            db.close();
        },
        terminated() {
            // …
        },
    })
    .then(function (result) {
        db = result;
        if (!globalThis.userdata) globalThis.userdata = db;
        else globalThis.userdata2 = db;
        resolve(performance.now());
    })
    .catch(reject);
    
    setTimeout(() => reject('Timeout while opening idb'), 10000);
});






export { db };





