import {Observer, Listener, EventTypes, EventReocrd,MessageTypes} from "../interfaces/observer";
import {ElementX, FormELement} from '../interfaces'
import {_throttle, _log, _warn} from '../utils/tools'
import {sendToServer} from '../utils/requestServer'
import snapShot from '../utils/SnapShot'
import {RECORD_CONFIG} from './constants'


const {getRecordIdByElement} = snapShot
export default class EventObserver implements Observer {
    public listeners: Listener[] = [];
    public options = RECORD_CONFIG.event

    constructor(options?: any) {
        if (typeof options === 'boolean' && options === false) {
            return
        }

        if (typeof options === 'object') {
            this.options = { ...this.options, ...options }
        }
    }

    public addListener = ({target, event, callback, options}: Listener, cb?: () => void) => {
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
        sendToServer(MessageTypes.event, record).then(resData => {
            console.log("event:", resData);
        });
    }

    // Provide that document's direction is `rtl`(default)
    public getScrollPosition = (): { x: number; y: number } => {
        // Quirks "BackCompat" mode on the contrary （false is standardMode "CSS1Compat"
        const isStandardsMode = document.compatMode === 'CSS1Compat'
        const x = isStandardsMode ? document.documentElement.scrollLeft : document.body.scrollLeft
        const y = isStandardsMode ? document.documentElement.scrollTop : document.body.scrollTop
        return {x, y}
    }

    public getScroll = (evt?: Event): void => {
        const {target} = evt || {target: document}
        let record = {type: EventTypes.scroll} as EventReocrd

        // 1. target is document
        // 2. No event invoking
        if (target === document || !target) {
            let {x, y} = this.getScrollPosition()
            record = {...record, x, y};
            //TODO: 节流
            this.sendRecord(record);
            return
        }

        let targetX = target as ElementX;
        const {scrollLeft: x, scrollTop: y} = targetX;
        const recorderId = getRecordIdByElement(targetX)
        record = {...record, x, y, target: recorderId}
        this.sendRecord(record);
    }

    public getResize = (): void => {
        const {clientWidth: w, clientHeight: h} = document.documentElement;
        const record: EventReocrd = {type: EventTypes.resize, w, h};
        this.sendRecord(record);
    }

    private getFormChange = (evt: Event): void => {
        const {target} = evt
        if ((target as HTMLElement).contentEditable === 'true') {
            return
        }
        const recorderId = getRecordIdByElement(target)

        let k: string
        let v: any

        if (!recorderId) return
        const itemsWhichKeyIsChecked = ['radio', 'checked']

        const targetX = target as FormELement
        const {type: formType} = targetX
        if (itemsWhichKeyIsChecked.includes(formType)) {
            k = 'checked'
            v = targetX.checked
        } else {
            k = 'value'
            v = targetX.value
        }

        const record: EventReocrd = {
            type: EventTypes.form,
            target: recorderId,
            k,
            v
        }
        this.sendRecord(record);
    }

    public install(): void {
        const {addListener} = this;
        const { scroll, resize, form } = this.options

        if(scroll){
            addListener({
                target: document,
                event: 'scroll',
                callback: _throttle(this.getScroll),
                options: true
            });
        }

        if(resize){
            addListener({
                target: window,
                event: 'resize',
                callback: _throttle(this.getResize)
            })
        }

        if(form){
            addListener({
                target: document,
                event: 'change',
                callback: this.getFormChange,
                options: true
            })

            // input event fires when value of <input> <select> <textarea> element has been altered.
            addListener({
                target: document,
                event: 'input',
                callback: _throttle(this.getFormChange, 300),
                options: true
            })
        }
        _log('events observer ready!')
    }

    public uninstall(): void {
        this.listeners.forEach(({target, event, callback}) => {
            target.removeEventListener(event, callback)
        })
    }
}
