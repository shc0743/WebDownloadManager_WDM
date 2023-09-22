

export class FilePicker {
    static TYPE_FILEPICKER = 0;
    static TYPE_DIRECTORYPICKER = 1;

    #type = null;
    constructor(type = FilePicker.TYPE_FILEPICKER) {
        this.#type = type;

    }

    pick({
        access_Read = true,
        access_Write = false,
        text = null,
    } = {}) {
        const params = new URL('/web/eFilePicker-UI.exe.html', location.href);
        params.searchParams.set('type', this.#type);
        const access = ((access_Read ? 0x4 : 0) | (access_Write ? 0x2 : 0));
        params.searchParams.set('access', access);
        if (text) params.searchParams.set('text', text);

        return new Promise((resolve, reject) => {
            const randomId = (new Date().getTime()) + '_' + Math.floor(1e8 * Math.random());
            params.searchParams.set('id', randomId);
            let ePicker = null;
            const message_handler = async (ev) => {
                if (ev.origin !== location.origin) return;
                if (ev.data?.id !== randomId) return;
                const key = ev.data.value;
                const value = await userdata.get('temp', key);
                await userdata.delete('temp', key);
                window.removeEventListener('message', message_handler);
                resolve(value);
                setTimeout(() => ((ePicker.onbeforeunload = null), ePicker.close()), 10);
            };
            window.addEventListener('message', message_handler);

            ePicker = window.open(params, '_blank', 'width=320,height=200');
            setInterval(() => {
                if (ePicker.closed) reject('Cancelled');
            }, 100);
        });
    }


};


