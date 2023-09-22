app.showModal();
if (location.hash !== '#debug') setTimeout(close, 5000);
document.querySelectorAll('[data-close]').forEach(el => el.addEventListener(el.dataset.close, () => close()));


const url = new URL(location.href);
const task = +url.searchParams.get('taskId');
if (!isNaN(task) && task > 0) {
    await import('/assets/scripts/storageApi.js');
    const { INIT } = await import('/assets/scripts/userdata.js');
    const { TaskManager } = await import('/context/download-core/Task.js');

    await INIT;

    globalThis.taskManager = new TaskManager();
    taskManager.init(globalThis.userdata2, url.searchParams.get('area') || 'taskStorage0');
    await taskManager.INIT;

    const t = await taskManager.get(task);
    console.log('task=', t);

    addItem(t);
}


function addItem(task) {
    const el = document.createElement('button');
    el.className = 'task--is_task task--task_item-wrapper';

    const elTitle = document.createElement('div');
    elTitle.className = 'task--is_task task--task_item-title';
    elTitle.innerText = task.filename;
    el.append(elTitle);

    const elUrl = document.createElement('div');
    elUrl.className = 'task--is_task task--task_item-url';
    elUrl.innerText = task.url;
    el.append(elUrl);

    el.onclick = () => {
        const url = new URL('./index.html', location.href);
        url.hash = '#/=@' + task.id;
        window.open(url);
    }

    document.getElementById('contents').append(el);
}


