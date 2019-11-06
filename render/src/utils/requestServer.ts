/** 发送数据到Server*/
import { EventName } from '../schemas/override'
import socket from '../utils/socket'

export function sendToServer(eventName:EventName,data) {
        socket.emit(eventName,data);
}
