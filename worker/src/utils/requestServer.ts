/** 发送数据到Server*/
import { EventName } from '../interfaces'
import socket from '../utils/socket'

export function sendToServer(eventName:EventName,data) {
    return new Promise((res)=>{
        // console.log(eventName,data);
        socket.connect.emit(eventName,data);
        socket.connect.on(eventName, function (resData) {
            res(resData);
        });
    })
}
