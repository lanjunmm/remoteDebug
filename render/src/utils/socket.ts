import io from 'socket.io-client'
import {SERVER} from './constants'
import {HttpFuncs, HttpReqMsgs,HTTPResponse,JSONPArguments,Events,EventTypes} from '../interfaces/types'
import Player from '../palyers/index'
import {DOMMutationTypes} from '../interfaces/types'


let socket = io(SERVER.HttpHost,{transports:['polling','websocket']}); //'polling'
let SocketID ="";

socket.on('connect', function () {
    console.log("socket 连接成功");
});
socket.on('id', function (msg) {
    SocketID = msg;
    socket.emit("id",{id:SocketID,name:"render"});
});


/** 执行http请求，将结果连带着reqID发回Server*/
socket.on(Events.fetch,function (reqMsg:HttpReqMsgs) {
    if(reqMsg.requestFunc!=HttpFuncs.fetch){ return;}
    Player.events.http.fetch(reqMsg).then(data=>{
        let ResMsg:HTTPResponse= {
            reqId:reqMsg.reqId,
            data:data
        };
        socket.emit("fetch",ResMsg);
        console.log("fetch Data:",ResMsg);
    });
});
socket.on(Events.xhr, function (reqMsg:HttpReqMsgs) {
    if(reqMsg.requestFunc!=HttpFuncs.xhr){ return;}
    Player.events.http.xhr(reqMsg).then(data=>{
        let ResMsg:HTTPResponse= {
            reqId:reqMsg.reqId,
            data:data
        };
        socket.emit("xhr",ResMsg);
        console.log("xhr Data:",ResMsg);
    });
});
socket.on(Events.beacon,function (reqMsg:HttpReqMsgs) {
    if(reqMsg.requestFunc!=HttpFuncs.beacon){ return;}
    Player.events.http.sendbeacon(reqMsg).then(data=>{
        let ResMsg:HTTPResponse= {
            reqId:reqMsg.reqId,
            data:data
        };
        socket.emit("beacon",ResMsg);
        console.log("beacon Data:",ResMsg)
    });
});

/** 发送jsonp请求，将结果发回Server*/
socket.on(Events.jsonp,function (jsonpMsg:JSONPArguments) {
    Player.events.jsonp.jsonp(jsonpMsg);
});

/**  接收快照、dom变化 */
socket.on(Events.snapshot,function (data) {
    Player.events.dom.renderSnapshot(data);
});
socket.on(Events.mutation,function (data) {
    console.log("mutaition",data);
    switch (data.type) {
        case DOMMutationTypes.node:
            Player.events.dom.paintNodeAddorRemove(data);
            break;
        case DOMMutationTypes.attr:
            Player.events.dom.paintAttributeMutate(data);
            break;
        case DOMMutationTypes.text:
            Player.events.dom.paintTextChange(data);
            break;
        default:
            break;
    }
});
socket.on(Events.history,function () {

});

/**  鼠标移动，scroll，resize事件 */
socket.on(Events.mouse,function (data) {
    Player.events.dom.paintMouseMove(data);
});
socket.on(Events.event,function (data) {
    switch (data.type) {
        case EventTypes.scroll:
            const {x,y,target}=data;
            Player.events.dom.paintScroll({x,y,target});
            break;
        case EventTypes.resize:
            const { w, h } =data;
            Player.events.dom.paintResize({w,h});
            break;
        case EventTypes.form:
            Player.events.dom.paintFormChange(data);
            break;
        default:
            break;

    }

});


export default socket;

