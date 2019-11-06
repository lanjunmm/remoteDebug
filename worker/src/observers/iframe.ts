import {Observer,IFRAMEArguments,MessageTypes} from '../interfaces/observer'
import {_log, _replace, _unReplace} from '../utils/tools'
import {SERVER} from './constants'

// 没用
export default class IframeObserver implements Observer{
    constructor(options:boolean){
        if (options === false) return
    }

    private hackPostMessage(){
        function postMessageReplaced(originPostMessage){
            return function (message: any, targetOrigin: string, transfer?: Transferable[]) {
                console.log('outside', targetOrigin);
                if(location.href===targetOrigin || message.type==="webpackOk"){
                    originPostMessage.apply(this,[...arguments]);
                } else {
                    console.log('postMessage', targetOrigin);
                    let msg: IFRAMEArguments = {
                        type: MessageTypes.iframe,
                        message: message,
                        targetOrigin: targetOrigin,
                        transfer: transfer
                    }
                    originPostMessage.apply(this, [msg, SERVER.IFrame, transfer]); //服务器的地址
                }
            }
        }
        _replace(Window,'postMessage',postMessageReplaced);
    }

    public install(){
        this.hackPostMessage();
        _log('iframe installed')
    }
    public uninstall(){
        _unReplace(Window,'postMessage');
    }
}
