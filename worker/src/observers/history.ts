import {_unReplace, _log, _parseURL, _replace} from '../utils/tools'
import {Observer, HistoryRecord, HistoryTypes,MessageTypes} from '../interfaces/observer'
import {sendToServer} from "../utils/requestServer";

export default class HistoryObserver implements Observer {
    public status: boolean = false
    private lastHref: string

    constructor(options: boolean) {
        if (options === false) return
    }

    private sendRecord(record) {
        console.log(record)
        sendToServer(MessageTypes.history, record).then(resData => {
            console.log("history:", resData);
        });
    }

    private getHistoryRecord(from: string | undefined, to: string | undefined,func: string): void {
        const parsedHref = _parseURL(location.href)
        const parsedTo = _parseURL(to)
        let parsedFrom = _parseURL(from)

        // Initial pushState doesn't provide `from` information
        if (!parsedFrom.path) {
            parsedFrom = parsedHref
        }

        this.lastHref = to

        const record: HistoryRecord = {
            type: HistoryTypes.history,
            func:func,
            from: parsedFrom.relative,
            to: parsedTo.relative
        }

        this.sendRecord(record);
    }

    private isSupportHistory(): boolean {
        return 'history' in window && !!window.history.pushState && !!window.history.replaceState
    }

    public install(): void {
        if (!this.isSupportHistory()) return

        const {getHistoryRecord} = this
        const self = this

        _replace(window, 'onpopstate', function (originalHandler) {
            return function (this: History, ...args: any[]): void {
                getHistoryRecord.call(self, self.lastHref, location.href,'onpopstate')
                originalHandler && originalHandler.apply(this, args)
            }
        })
        _replace(window, 'pushState', function (originalMethod) {
            return function (this: History, ...args: any[]): void {
                const url = args.length > 2 ? args[2] : undefined
                if (url) getHistoryRecord.call(self, self.lastHref, String(url),'pushState')
                return originalMethod.apply(this, args)
            }
        })
        _replace(window, 'replaceState', function (originalMethod) {
            return function (this: History, ...args: any[]): void {
                const url = args.length > 2 ? args[2] : undefined
                if (url) getHistoryRecord.call(self, self.lastHref, String(url),'replaceState')
                return originalMethod.apply(this, args)
            }
        })

        _log('history installed')
        this.status = true
    }

    public uninstall(): void {
        _unReplace(window, 'onpopstate')
        _unReplace(window.history, 'pushState')
        _unReplace(window.history, 'replaceState')
        this.status = false
    }
}
