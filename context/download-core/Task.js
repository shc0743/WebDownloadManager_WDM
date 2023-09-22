export class Task {
    constructor(id, _Data) {
        if (typeof id === 'object' && 'id' in id) {
            for (const i of (Reflect.ownKeys(id))) {
                this[i] = id[i];
            }
            return;
        }


        Object.defineProperty(this, 'id', {
            value: id,
            writable: true,
            enumerable: true
        });

        
        for (const i in _Data) {
            this[i] = _Data[i];
        }
        
    }

};

export class Tasks extends Array {
    constructor(arg1 = undefined, arg2 = undefined, arg3 = undefined) {
        super(arg1, arg2, arg3);
    }


    sync() {
        
    }

    
    add(task = new Task) {
        this.push(task);
        storage.taskShouldUpdate = (new Date().getTime());

    }


    
    
};

export class TaskManager {
    #data = null;
    #data2 = new Map();
    // #area = 'null';
    #idb = Object.create(IDBDatabase.prototype);
    #objectStore = 'null';
    #_internal_init1done = null;
    #_internal_init1fail = null;
    INIT = null;

    constructor(idb, objectStore) {
        this.#data = new Array;
        // this.#area = areaName;
        const init = (idb, objectStore) => {
            this.#idb = idb;
            this.#objectStore = objectStore;
            if (this.init) delete this.init;
            const ret = this.#init();
            ret.then(r => {
                if (this.#_internal_init1done) this.#_internal_init1done.call(this, r);
            }).catch(r => {
                if (this.#_internal_init1fail) this.#_internal_init1fail.call(this, r);
            });
            return ret;
        };
        if (idb) {
            this.INIT = init(idb, objectStore);
        } else {
            this.INIT = new Promise((resolve, reject) => {
                this.#_internal_init1done = resolve;
                this.#_internal_init1fail = reject;
            });
            this.init = init;
        }
    }

    async #init() {
        await new Promise(queueMicrotask);
        await new Promise(queueMicrotask);
        await this.#_syncWorker(true);
        return true
    }

    async #_syncWorker(/*merge*/__unused0 = true) {
        return;
        /*let data = await storage.get(this.#area);
        if (!Array.isArray(data)) data = [];
        const addedData = this.#data || [];
        this.#data = Array.from(data).map(value => new Task(value));
        if (merge) {
            const ids = new Set();
            const new_array = this.#data.concat(addedData)//Array.from(new Set(this.#data.concat(addedData)));
            const uniquified_array = new Array();
            this.#data = uniquified_array;
            for (const i of new_array) {
                if (!i) continue;
                if (ids.has(i.id)) continue;
                ids.add(i.id);
                this.#data.push(i);
            }
        }
        await storage.set(this.#area, this.#data);*/
        const addedData = this.#data || [];
        const ids = new Set(), ids2 = new Array;
        this.#data = []; this.#data2.clear();
        const taskids = await this.#idb.getAllKeys(this.#objectStore);
        // console.log(taskids);
        for (const i of taskids) {
            let task = await this.#idb.get(this.#objectStore, i);
            if (!task instanceof Task) task = new Task(task);
            this.#data.push(i);
            ids.add(i.id);
        }
        for (const i of addedData) {
            if (!i?.id) continue;
            ids2.push(i);
            if (ids.has(i.id)) continue;
            this.#data.push(i);
        }


        for (const i of this.#data) {
            this.#data2.set(i.id, i);
        }

    }

    async #_sync(){
        // await storage.set(this.#area, this.#data);
        // storage.taskShouldUpdate = (new Date().getTime());
        await this.#_syncWorker();
    }

    async sync() {
        await this.INIT;
        return await this.#_sync();
    }

    async update(_Opt_task = undefined) {
        await this.INIT;
        // await this.#_sync(true);

        if (_Opt_task && _Opt_task instanceof Task) await this.#idb.put(this.#objectStore, _Opt_task, _Opt_task.id);
        storage.taskShouldUpdate = (new Date().getTime());
    }


    async add(task = new Task) {
        if (!task instanceof Task) throw new TypeError('argument0 should be instanceof Task');
        await this.INIT;
        // this.#data.push(task);
        let taskId = task.id;
        if (await this.#idb.get(this.#objectStore, task.id)) {
            const taskId2 = taskId;
            for (let i = taskId + 1, l = i + 1000; i < l; ++i){
                if (!(await this.#idb.get(this.#objectStore, i))) {
                    taskId = i;
                    break;
                }
            }
            if (taskId === taskId2) {
                throw new Error('No ID Available');
            }
        }
        task.id = taskId;
        await this.#idb.put(this.#objectStore, task);
        this.update(task.id);
        return taskId;
    }

    async get(taskId = -1) {
        // for (const i of this.#data) {
        //     if (i.id === taskId) return i;
        // }
        // return null;
        await this.INIT;
        const value = await this.#idb.get(this.#objectStore, taskId);
        if (value && (!value instanceof Task)) return new Task(value);
        return value;
    }


    async getAll() {
        throw new Error('The API "TaskManager.prototype.getAll" is deprecated; use "TaskManager.prototype.enumAll" instead.');
        // return this.#data.concat();
        await this.INIT;
        const result = new Array;
        const taskids = await this.#idb.getAllKeys(this.#objectStore);
        for (const i of taskids) {
            let task = await this.#idb.get(this.#objectStore, i);
            if (!task instanceof Task) task = new Task(task);
            result.push(task);
        }
        return result;
    }
    async enumAll(cb, type = undefined, end = 0xffff, begin = 0x0) {
        try {
            let tx = this.#idb.transaction(this.#objectStore);
            let cursor = await tx.store.openCursor(undefined, type), n = 0;
            try {
                begin && (await cursor.advance(begin));
            } catch { begin = 0x0 }

            while (cursor) {
                cb(cursor.value, n++);
                try { cursor = await cursor.continue(); }
                catch { break; }
            }
        } catch (error) { console.error('Unexpected error in updateTaskList:', error); }
    }


    async updateTask(taskId, datasToUpdate = {}) {
        if (!taskId || !datasToUpdate) return;
        await this.INIT;
        const value = await this.#idb.get(this.#objectStore, taskId);
        if (!value) return false;
        for (const i of Reflect.ownKeys(datasToUpdate)) {
            value[i] = datasToUpdate[i];
        }
        await this.#idb.put(this.#objectStore, value);
        // storage.taskShouldUpdate = (new Date().getTime());
        return true;
    }



};



