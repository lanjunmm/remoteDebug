export interface MyWindow extends Window {
  requestIdleCallback?: any;
  [key: string]: any;
}

export interface FormELement extends HTMLElement {
    type: string
    value: string
    checked?: boolean
}
export type EventName = 'mutation' | 'console' | 'event' | 'mouse' | 'error' | 'renderEvent' | 'worker_jsonp' | 'snapshot'

export const myWindow: MyWindow = window;

export interface ElementX extends HTMLElement {}
