import socket from './utils/socket'

export default class Render {
    constructor(){
        window['_debugSocket']=socket; // jsonp 全局script返回时
        window['_sendToServer']=function sendToServer(funcName,data) {
            let socket = window['_debugSocket'];
            let msg = funcName+"("+JSON.stringify(data)+")";
            console.log(msg);
            socket.emit("jsonp",msg);
        };

        const playerDefaultStyle = document.createElement('style');
        playerDefaultStyle.setAttribute('type', 'text/css');
        playerDefaultStyle.innerHTML = `body{background: #000;}`;
        document.head!.insertBefore(playerDefaultStyle, document.head!.firstChild!);
    }
}
/** 打包留出全局接口：*/
window['render'] = new Render();

