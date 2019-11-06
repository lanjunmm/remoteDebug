import {Observer} from "./observer";

export type ElementX = HTMLElement | Element

export interface WORKER {
    observers: Observers
    options: any
    debuging: boolean
    start: () => void
    stop: () => void
}

export interface FormELement extends HTMLElement {
    type: string
    value: string
    checked?: boolean
}
export type ObserverName = 'mutation' | 'console' | 'event' | 'mouse' | 'error' | 'history' | 'http' | 'jsonp'| 'iframe'
export type EventName = 'mutation' | 'console' | 'event' | 'mouse' | 'error' | 'history' | 'worker_jsonp' | 'snapshot' | 'iframe'
export type Observers = { [key in ObserverName]: Observer }

export interface SnapShoter {
    inited: boolean
    latestSnapshot: string
    takeSnapshotForPage(): void
}

export interface MutationRecordX extends MutationRecord {
    target: HTMLElement
    previousSibling: HTMLElement
    nextSibling: HTMLElement
}
