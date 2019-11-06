import {MouseReocrd, MouseTypes, Observer, Listener,MessageTypes} from '../interfaces/observer'
import {_throttle, _log, _warn} from '../utils/tools'
import {sendToServer} from "../utils/requestServer";
import {RECORD_CONFIG} from './constants'

/**
 * Observe mouse behavior
 * and produce an Record
 */
export default class MouseObserver  implements Observer {
    public listeners: Listener[] = []
    public options = RECORD_CONFIG.mouse

    constructor(options?: any) {
        if (typeof options === 'boolean' && options === false) {
            return
        }

        if (typeof options === 'object') {
            this.options = { ...this.options, ...options }
        }
    }

    private addListener = ({target, event, callback, options = false}: Listener, cb?: () => void) => {
        target.addEventListener(event, callback, options)
        this.listeners.push({
            target,
            event,
            callback
        })

        try {
            cb && cb()
        } catch (err) {
            _warn(err)
        }
    }

    private sendRecord(record) {
        sendToServer(MessageTypes.mouse, record).then(resData => {
            console.log("mouse:", resData);
        });
    }

    private getMouseClickRecord = (evt: MouseEvent): void => {
        const {pageX: x, pageY: y} = evt
        const record: MouseReocrd = {type: MouseTypes.click, x, y}

        this.sendRecord(record)
    }

    private getMouseMoveRecord = (evt: MouseEvent): void => {
        const {pageX: x, pageY: y} = evt
        const record: MouseReocrd = {type: MouseTypes.move, x, y}

        this.sendRecord(record)
    }

    public install(): void {
        const {addListener} = this
        const { click, mousemove } = this.options

        if(click){
            addListener({
                target: document,
                event: 'click',
                callback: this.getMouseClickRecord
            })
        }

        if(mousemove){
            addListener({
                target: document,
                event: 'mousemove',
                callback: _throttle(this.getMouseMoveRecord, 100) //50
            })
        }
        _log('mouse observer ready!')
    }

    public uninstall() {
        this.listeners.forEach(({target, event, callback}) => {
            target.removeEventListener(event, callback)
        })
    }
}
