import {Observer,JSONPArguments,MessageTypes} from '../interfaces/observer'
import {_log, _replace, _unReplace} from '../utils/tools'
import { sendToServer } from '../utils/requestServer'

export default class Jsonp implements Observer{
    constructor(options:boolean){
        if (options === false) return
    }
    private hackCreateElement() {
        let replaceCreateElement = (originalFunc)=>{
            return (tagName: string, options?: ElementCreationOptions): HTMLElement=>{
                let element = originalFunc.apply(document,[tagName,options]);
                if (tagName.toLowerCase() === 'script') {
                    this.hackScriptNode(element);
                }
                return element;
            }
        };
        _replace(document,'createElement',replaceCreateElement);
    }
    private createCallback(data){
        console.log("jsonp收到Server：",data);
        // let funcName = data.funcName;
        // let args = data.args;
        let ele  = document.createElement("script");
        ele.innerHTML = data;
        // ele.innerHTML = `${funcName}(${args})`;
        document.body.appendChild(ele);
    }
    private hackScriptNode(element) {
        let that = this;
        function replaceSetAttribute(originAttribute) {
            return function () : void{
                let ele = this;
                let mayJsonp = ((ele instanceof Element) && (ele.tagName.toLowerCase() === "script")&&(arguments[0]==="src"));
                if (mayJsonp) {
                    let msg:JSONPArguments = {
                        type: "jsonp",
                        taName: ele.tagName.toLowerCase(),
                        src: arguments[1]
                    };
                    // socket: 转发script标签信息到Render,接收Render的消息
                    sendToServer(MessageTypes.jsonp,msg).then(data=>{
                        that.createCallback(data);
                    });
                }else {
                    originAttribute.apply(this,arguments);
                }
            }
        }
        _replace(element,'setAttribute',replaceSetAttribute); // element.__proto__ ---> element

        let src=undefined;
        Object.defineProperty(element, 'src', {
            get: function(){
                return src;
            },
            set: function(newValue) {
                src = newValue;
                this.setAttribute('src',newValue);
            }
        });

        function replaceSetAttibuteNode(originSetAttributeNode) {
            return function(attr:Attr){
                let ele = this;
                let mayJsonp = ((ele instanceof Element) && (ele.tagName.toLowerCase() === "script")&&(attr.name === "src"));
                if(mayJsonp){
                    ele.setAttribute('src',attr.value);
                }else{
                    originSetAttributeNode.apply(this,arguments);
                }
            }
        }
        _replace(element,'setAttributeNode',replaceSetAttibuteNode);

        //TODO: element.attributes属性,以及setNamedItem
    }

    public install(){
        this.hackCreateElement();
        _log('JsonP installed')
    }
    public uninstall(){
        _unReplace(document,'createElement');
        _unReplace(HTMLScriptElement,'setAttribute');
        _unReplace(HTMLScriptElement,'setAttributeNode');
    }
}
