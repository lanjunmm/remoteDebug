export const REQUESTINIT = {
        body: null,
        cache: "",
        credentials: "",
        headers: [],
        integrity: "",
        keepalive: false,
        method: "",
        mode: "",
        redirect: "",
        referrer: "",
        referrerPolicy: "",
        signal:  null,
        window: null
    };

export const SERVER = {
    HttpHost: "http://localhost:3000",
    SocketHost:'ws://localhost:3000',
    HttpFetch: "http://localhost:3000/fetch",
    HttpXhr: "http://localhost:3000/xhr",
    HttpBeacon: "http://localhost:3000/beacon",
    IFrame:'http://localhost:3000/testifr"'
};
export const RECORDER_ID: string = 'recorder-id'

export const RECORD_CONFIG = {
    mutation: true,
    history: true,
    error: {
        jserror: true,
        unhandledrejection: true
    },
    console: {
        info: true,
        error: true,
        log: false,
        warn: true,
        debug: true
    },
    event: {
        scroll: true,
        resize: true,
        form: true
    },
    http: {
        xhr: true,
        fetch: true,
        beacon: true
    },
    mouse: {
        click: true,
        mousemove: true
    },
    jsonp:true,
    iframe:false
}


