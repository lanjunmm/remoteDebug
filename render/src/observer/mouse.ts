import {MouseClickRecord, MouseTypes, Observer, Listener,MessageTypes} from '../interfaces/observer'
import { _log, _warn} from '../utils/tools'
import {sendToServer} from "../utils/requestServer";
import DomTreeBufferer from '../palyers/dom-bufferer'
import { RECORDER_ID } from '../utils/constants';


/**
 * Observe mouse behavior
 * and produce an Record
 */
export default class MouseObserver  implements Observer {
    public listeners: Listener[] = []

    constructor() {
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
        sendToServer(MessageTypes.renderEvent, record);
    }

    private getMouseClickRecord = (evt: MouseEvent): void => {
        const {pageX: x, pageY: y} = evt;
        let clickedEle = DomTreeBufferer.domLayer.contentDocument.elementFromPoint(x,y);
        let eleId = clickedEle.getAttribute(RECORDER_ID);
        const record: MouseClickRecord = {type: MouseTypes.click, target:eleId}
        //
        this.sendRecord(record)
    }

    public install(): void {
        const {addListener} = this
        const layerDoc = DomTreeBufferer.domLayer.contentDocument;

            addListener({
                target: layerDoc,
                event: 'click',
                callback: this.getMouseClickRecord
            });
        _log('mouse observer ready!')
    }

    public uninstall() {
        this.listeners.forEach(({target, event, callback}) => {
            target.removeEventListener(event, callback)
        })
    }
}
