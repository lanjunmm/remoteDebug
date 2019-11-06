import {JSONPArguments} from '../interfaces/types'


/**
 * get_params——获取url中的参数
 * nameIllegal——改名字是否合法，即：以下划线、美元符号、字母 开头
 * createCallback——每个合法的名字都创建一个函数，函数的作用是将函数名和arguments一起发送给Server
 * jsonp——创建jsonp请求，发送数据给server
 * */
class JsonpPlayer {
    constructor(){}
    private get_params(_url){
        let pattern = /(\w+)=(\w+)/ig;
        let parames = {};
        _url.replace(pattern, function(_a, b, c){
            parames[b] = c;
        });
        return parames;
    }
    private nameIllegal(name):boolean{
        let firstChar = name.charCodeAt(0);
        return (firstChar==95 || firstChar==36||(firstChar>=65 && firstChar<=90)||(firstChar>=97 && firstChar<=122));
    }
    private createCallback(funcs){
        for(let key in funcs){
            let funcName = funcs[key];
            if(this.nameIllegal(funcName)){
                let existEle = document.getElementById(funcName);
                if(existEle==null){
                    let ele  = document.createElement("script");
                    ele.id=funcName;
                    ele.innerHTML = `function ${funcName}(){  _sendToServer(${funcName}.name, [...arguments]); }`;
                    document.head.appendChild(ele);
                }
            }
        }
    }
    public jsonp(jsonpMsg:JSONPArguments){
        console.log("jsonpMsg：",jsonpMsg);
        let args = this.get_params(jsonpMsg.src);
        this.createCallback(args);

        let scriptEle = document.createElement("script");
        scriptEle.src = jsonpMsg.src;
        document.body.appendChild(scriptEle);
    }
}
let jsonpPlayer = new JsonpPlayer();
export default jsonpPlayer

