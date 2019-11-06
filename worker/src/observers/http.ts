import {HttpFuncs, HttpReqMsgs, Observer, MessageTypes,FetchArguments,HttpOptions} from "../interfaces/observer";
import {_newuuid, _replace, _unReplace,_log} from '../utils/tools'
import {REQUESTINIT, SERVER,RECORD_CONFIG} from './constants'
import {isFunction} from '../utils/is'

export default class HttpObserver implements Observer {
    private ReqMap: Map<string, HttpReqMsgs> = new Map();
    public options: HttpOptions = RECORD_CONFIG.http
    // private urlMatch = /(\w+):\/\/([^/:]+)(:\d*)?([^# ]*)/;
    private urlMatch = /(\w+):\/\/([^/:]+)(:\d*)?\/([^]+)\/([^# ]*)/;

    constructor(options?: any) {
        if (typeof options === 'boolean' && options === false) {
            return
        }
        if (typeof options === 'object') {
            this.options = { ...this.options, ...options }
        }
    }

    /*hijack sendBeacon：将sendBeacon的url,data发到Server*/
    private hackBeacon() {
        if (!navigator.sendBeacon) {
            return;
        }
        let that = this;
        function replaceBeacon(originalBeacon) {
            return function (this: Navigator, url: string, data?:any) :boolean{
                const requestId = _newuuid();
                const msg: HttpReqMsgs = {
                    type: MessageTypes.network,
                    requestFunc: HttpFuncs.beacon,
                    data: {
                        url: url,
                        data: data
                    },
                    reqId: requestId
                };
                that.ReqMap.set(requestId, msg);
                return originalBeacon.call(this, SERVER.HttpBeacon, JSON.stringify(msg));
            }
        }
        _replace(navigator, "sendBeacon", replaceBeacon);
    }

    /*hijack sendBeacon：fetch方法的url和d配置参数发到Server*/
    private hackFetch() {
        let that = this;
        if (!(window.fetch && window.fetch.toString().includes('native'))) { return; }

        function replaceFetch(originFetch) { //originFetch
            return function (input: string | Request, config?: RequestInit): Promise<Response> {
                // return new Promise((res, rej) => {
                // the argument's type and value
                    let fetchArgs:FetchArguments = {
                        firstArg: {
                            type: "",
                            url: ""
                        },
                        secondArg: null
                    };

                    //if the first one argument--input's type is Request,
                    // then get Request's attributes(key,value) as the second argument to render fetch
                    if (typeof input === 'string') {
                        fetchArgs.firstArg.type = "url";
                        fetchArgs.firstArg.url = input;
                    } else if (input instanceof Request) {
                        let keys = Object.keys(REQUESTINIT);
                        let obj = {};
                        for (let i = 0; i < keys.length; i++) {
                            let key = keys[i];
                            if (key == "headers") {
                                let headers = REQUESTINIT[key];
                                input[keys[i]].forEach((v, k) => {
                                    headers.push([k, v]);
                                });
                                obj[key] = headers;
                                continue;
                            }
                            obj[key] = input[key] || REQUESTINIT[key];
                        }
                        fetchArgs.firstArg.type = "Request";
                        fetchArgs.firstArg.url = input['url'];
                        fetchArgs.secondArg = obj;
                    }
                    if (!!config) {
                        let keys = Object.keys(config);
                        for (let i = 0; i < keys.length; i++) {
                            let key = keys[i];
                            if (key == "headers") {
                                let headers = fetchArgs.secondArg[key];
                                // @ts-ignore
                                config[key].forEach((v, k) => {
                                    headers.push([k, v]);
                                });
                                if (headers.length > 0) {
                                    fetchArgs.secondArg[key] = headers;
                                }
                                continue;
                            }
                            fetchArgs.secondArg[key] = config[key] || fetchArgs.secondArg[key];
                        }
                    }
                    const requestId= _newuuid();
                    const msg: HttpReqMsgs = {
                        type: MessageTypes.network,
                        requestFunc: HttpFuncs.fetch,
                        data: fetchArgs,
                        reqId: requestId
                    };
                    that.ReqMap.set(requestId, msg);
                    // 调用原生fetch方法，转发fetch信息到Server,接收Server的消息
                    return originFetch.apply(this,[SERVER.HttpFetch,{
                        body:JSON.stringify(msg),
                        headers: {
                            'content-type': 'application/json',
                        },
                        method: 'POST'
                    }]);
            }
        }

        _replace(window, 'fetch', replaceFetch);
    }

    /*hijack XMLHttpRequest：xhr方法的url和header等信息发到Server*/
    private hackXHR() {
        let that = this;

        function replaceXHROpen(originOpen) {
            return function (this, method, url, async = true):void {
                this.__local__ = false;
                let location = url.match(that.urlMatch);
                if (location != null && (location[2] == "localhost" || location[2] == "127.0.0.1") && (location[4] == "sockjs-node" || location[4] == "socket.io")) {
                    this.__local__ = true;
                    originOpen.apply(this, [...arguments]);
                } else {
                    const requestId = _newuuid();
                    this.__id__ = requestId;
                    let msg: HttpReqMsgs = {
                        type: MessageTypes.network,
                        requestFunc: HttpFuncs.xhr,
                        data: {
                            url,
                            method,
                            async,
                            headers: {},
                            body: null
                        },
                        reqId: requestId
                    };
                    that.ReqMap.set(requestId, msg);
                    // return originOpen.apply(this, arguments);//arguments
                    return originOpen.apply(this, ["POST", SERVER.HttpXhr, async]);//arguments
                }
            }
        }

        function replaceXHRSetRequestHeader(originSet) {
            return function (this, key: string, value: any):void {
                if (this.__local__) {
                    originSet.apply(this, [...arguments]);
                } else {
                    const requestId = this.__id__;
                    const record = that.ReqMap.get(requestId)
                    if (record) {
                        record.data.headers[key] = value
                    }
                    originSet.apply(this, [...arguments]);
                }
            }
        }

        function replaceXHRSend(originSend) {
            return function (this, body?: Document | BodyInit | null):void{
                if (this.__local__) {
                    originSend.apply(this, [...arguments]);
                }
                else {
                    const thisXHR = this;
                    const requestId = this.__id__
                    const record = that.ReqMap.get(requestId)
                    if (record) {
                        record.data.body = body;
                    }

                    function onreadystatechangeHandler(): void {
                        console.log("onreadystatechangeHandler,readyState:",this.readyState);
                    }

                    // TODO: hijack xhr.onerror, xhr.onabort, xhr.ontimeout
                    if ('onreadystatechange' in thisXHR && isFunction(thisXHR.onreadystatechange)) {
                        _replace(thisXHR, 'onreadystatechange', originalStateChangeHook => {
                            return (...args) => {
                                try {
                                    onreadystatechangeHandler.call(thisXHR)
                                } catch (err) {
                                    console.error(err);
                                }
                                // 调用原本的onreadystateChange方法
                                originalStateChangeHook.call(thisXHR, ...args)
                            }
                        })
                    } else {
                        thisXHR.onreadystatechange = onreadystatechangeHandler
                    }
                    try {
                        return originSend.call(this, JSON.stringify(record));
                    } catch (e) {
                        console.error(e);
                    }
                }

            }
        }
        const XHRProto = XMLHttpRequest.prototype;
        _replace(XHRProto, 'setRequestHeader', replaceXHRSetRequestHeader)
        _replace(XHRProto, 'open', replaceXHROpen)
        _replace(XHRProto, 'send', replaceXHRSend)
    }

    public install() {
        const { beacon, fetch, xhr } = this.options
         if (beacon) {
             this.hackBeacon()
         }

        if (fetch) {
            this.hackFetch()
        }

        if (xhr) {
            this.hackXHR()
        }
        _log('http observer ready!')
    }

    public uninstall() {
        _unReplace(window.navigator, 'sendBeacon');
        _unReplace(window, 'fetch');
    }

}
