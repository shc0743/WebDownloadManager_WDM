


export async function work_DownloadFile({
    url,
    method = 'GET',
    range = null,
    body: req_body = undefined,
    referrerPolicy = 'no-referrer',
    signal = new AbortController,
    dataSendToCallback = false,
}, callback = null, taskId = null) {
    const req = new Request({
        url,
        credentials: 'include',
        method, body: req_body,
        referrerPolicy,
    });
    if (range) {
        req.headers.append('range', 'bytes=' + range);
    }
    if (!signal instanceof AbortController) signal = new AbortController();
    const resp = await fetch(req, {
        signal: signal.signal
    });
    if (!resp.ok) return {
        success: false, code: -resp.status,
        response: resp,
    };
    const len = +resp.headers.get('content-length');

    const cb = typeof callback === 'function' ? callback : async function (downloaded = 0, total = 0, count = 0, taskId = 0, data = null) {};

    const resp_body = resp.body;
    const reader = resp_body.getReader();
    let readed = 0, count = 0;
    let dbuf = [];
    while (1) {
        ++count;
        
        const data = await reader.read();
        if (data.done) break;
        readed += data.value.length;
        queueMicrotask(() => cb(readed, len, count, taskId));

        dbuf.push(data.value);

        if (dataSendToCallback) {
            const blob = new Blob(dbuf);
            dbuf = null;

            try {
                const r = cb(readed, len, count, taskId, blob);
                if (r instanceof Promise) await r;
            } catch (error) {
                signal.abort();
                return { success: false, code: -990, response: resp, error };
            }
        }
    }
    

    if (dataSendToCallback) return {success:true};

    const blob = new Blob(dbuf);
    dbuf = null;

    return { success: true, response: resp, blob: blob };
    
}


import { Task } from './Task.js';
import * as TaskStates from '../../assets/defs/index.js';
export async function DownloadFile(url, filename, entryId) {
    // return {
    //     success: false,
    //     text: 'Not implemented'
    // }


    // decide task id
    let taskId = (await storage.nextTaskId);
    if (isNaN(taskId)) taskId = 1;


    // create task
    const task = new Task(taskId, {
        url, filename, entryId,
        fileSize: -1,
        partCount: -1,
        parts: {},
        abortControllerIds: [],

    });
    task.time = new Date().getTime();
    taskId = task.id = await taskManager.add(task);
    await storage.set('nextTaskId', taskId + 1);
    


    try {
        await StartDownload(taskId);
        return {
            success: true,
            taskId: taskId,
        }
    } catch (error) {
        return {
            success: false,
            text: String(error.stack),
        }
    }


    // done
    return JSON.stringify(await storage.taskStorage0)
    return {
        success: false,
        text: JSON.stringify(await storage.taskStorage0),
    }

}



export async function StartDownload(taskId = -1) {
    const task = await taskManager.get(taskId);
    if (!task) throw new Error('Task not found');

    await taskManager.updateTask(taskId, { state: TaskStates.TASK_STATE_START_PENDING, status: TaskStates.TASK_STATE_START_PENDING });
    
}







