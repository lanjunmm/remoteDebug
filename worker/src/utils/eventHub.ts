import {isFunction} from './is'

export default class EventHub {
    public queue: Map<string, Function[]>  = new Map();

    // add an action into event-queue named hook
     public $on = (hook:string, action: Function):void =>{
         const {queue} = this;
         const existFuncs = queue.get(hook) || [];
         queue.set(hook, [...existFuncs,action]);
     }

    public $emit = (hook: string, ...args): void => {
        const Q = this.queue.get(hook) || []
        if (!Q.length) { return }
        try {
            Q.forEach(action => {
                if (isFunction(action)) {
                    action(...args)
                }
            })
        } catch (error) {
            console.error(error)
        }
    }

    public $off = (hook: string, thisAction: Function): void => {
        const Q = this.queue.get(hook) || []
        if (!Q.length) {
            return
        }

        const index = Q.indexOf(thisAction);

        if (index !== -1) {
            Q.splice(index, 1)
            this.queue.set(hook, Q)
        }
    }
}
