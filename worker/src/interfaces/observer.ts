import { ElementX } from './index'

export type Observer = {
    options?: boolean | object
    install(options?: object): void
    uninstall(): void
}

export type SOCKET = {
    connect?: any
}

export enum HistoryTypes {
    history = 'history'
}
export type HistoryRecord = {
    type: HistoryTypes
    func:string // which function
    from: string // beacon record has no id
    to: string
}



export enum HttpFuncs {
    beacon = 'beacon',
    fetch = 'fetch',
    xhr = 'xhr'
}
export type HttpOptions = {
    beacon?: boolean
    fetch?: boolean
    xhr?: boolean
}
export enum MessageTypes {
    network = 'network',
    jsonp = 'worker_jsonp',
    iframe = 'iframe',
    mutation = 'mutation',
    console='console' ,
    event='event' ,
    mouse='mouse' ,
    error='error' ,
    history='history' ,
    snapshot='snapshot'
}
export type HttpReqMsgs = {
    type:string
    requestFunc: HttpFuncs,
    reqId:any
    url?: string
    headers?: { [key: string]: any } // nonexistence in beacon request
    data?:any
    payload?: any // xhr request payload
    response?: any
    method?: string
    status?: number
    errmsg?: any
    steps?: string
}
export type FetchArguments = {
    firstArg:{
        type:string,
        url:string
    }
    secondArg:Object
}
export type JSONPArguments = {
    type: string,
    taName: string,
    src: string
};
export type IFRAMEArguments = {
    type: string,
    targetOrigin: string
    message: any,
    transfer?:Transferable[]
};


export type Listener = {
    target: Window | Document | ElementX
    event: string
    callback: EventListenerOrEventListenerObject
    options?: AddEventListenerOptions | boolean
}
export enum EventTypes {
    scroll = 'scroll',
    resize = 'resize',
    form = 'form'
}
export type EventReocrd = {
    type: EventTypes
    // scroll
    x?: number
    y?: number
    // resize
    w?: number
    h?: number
    // form change
    target?: number
    k?: string
    v?: number | string
}
export type DOMMutationRecord = {
    type: DOMMutationTypes
    target: number
    // exist when mutation type is attribuites
    attr?: { key: string; value: string }
    // when type is childList
    prev?: number // target's previousSibling's recorderId
    next?: number // nextSibling's recorderId
    add?: NodeMutationData[]
    remove?: NodeMutationData[]
    // when type is characterData
    text?: string
    html?: string
}
export enum DOMMutationTypes {
    attr = 'attr', // attribute mutate
    node = 'node', // node add or remove
    text = 'text' // text change
}
export interface NodeMutationData {
    index?: number // node's index in parentElement, include textNodes, may exist when add or remove
    type: 'text' | 'ele'
    /* target, exist when node been removed */
    target?: number
    textContent?: string // exist when textNode been removed
    /* index and html here only when it was an add operation */

    html?: string // addnode's html or text
}

export type MouseReocrd = {
    type: MouseTypes
    x?: number
    y?: number
}
export enum MouseTypes {
    click = 'click',
    move = 'move'
}

export enum ConsoleLevels {
    info = 'info',
    error = 'error',
    log = 'log',
    warn = 'warn',
    debug = 'debug'
}

export type ConsoleRecord = {
    type: 'console'
    level: ConsoleLevels // console level,
    input?: any[]
}

export enum ErrorTypes {
    jserr = 'jserr',
    unhandledrejection = 'unhandledrejection'
}

export type ErrorOptions = {
    jserror: boolean
    unhandledrejection: boolean
}

export type ErrorRecord = {
    type: ErrorTypes
    msg: string
    // fields below existed only when type === jserr
    url?: string
    line?: string
    err?: any
    stack?: string
}
