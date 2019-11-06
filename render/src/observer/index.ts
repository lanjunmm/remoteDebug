import EventObserver from './event'
import MouseObserver from './mouse'
import {Observer } from '../interfaces/observer'


class InitObserver {
    public observers = {
        mouse: null,
        event: null
    }

    public init(){
        this.observers = {
            event: new EventObserver(),
            mouse: new MouseObserver()
        };
        Object.keys(this.observers).forEach((observerName) => {
            if (observerName!=="mutation"&&this.observers[observerName]!=null) {
                (this.observers[observerName] as Observer).install();
            }
        });
    }
}

let initObserver = new InitObserver();
export default initObserver;
