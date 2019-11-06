import io from 'socket.io-client'
import {SERVER} from '../observers/constants'
import {SOCKET} from '../interfaces/observer'
import snapShot from "./SnapShot";
import EventHub from "../utils/eventHub";
import mousePlayer from "../players/mouse";
import eventsPlayer from "../players/events";

class Socket extends EventHub implements SOCKET{
    public connect=null;
    public SocketID="";
    constructor(){
        super();
        this.install();
    }

    public install(){
            this.connect= io(SERVER.HttpHost,{transports:['polling','websocket']});
            this.connect.on('connect',  ()=> {
                console.log("socket 连接成功");
                this.getSnapshot();
                this.$emit('initMutation');
                this.listeners();
            });
           this.connect.on('id',  (msg)=> {
               console.log('id: ',msg);
               this.SocketID = msg;
               this.connect.emit("id", {id: this.SocketID, name: "worker"});
           });
           console.log("socket");
    }

    private getSnapshot(){
        const { clientWidth: w, clientHeight: h } = document.documentElement
        const isStandardsMode = document.compatMode === 'CSS1Compat'
        const x = isStandardsMode ? document.documentElement.scrollLeft : document.body.scrollLeft
        const y = isStandardsMode ? document.documentElement.scrollTop : document.body.scrollTop
        const host = location.protocol+"//"+location.host;
        let firtstSnapShot =  {
            type: 'snapshot',
            scroll: { x, y },
            resize: { w, h},
            referer:host,
            snapshot: snapShot.takeSnapshotForPage() // 第一次调用返回值是<head>部分outerHtml
        };
        console.log("发出快照");
        this.connect.emit('snapshot',firtstSnapShot);
    }
    private listeners(){
        this.connect.on('renderEvent',function (data) {
            switch (data.type) {
                case "click":
                    mousePlayer.replayClick(parseInt(data.target));
                    break;
                case "scroll":
                    eventsPlayer.paintScroll(data);
                    break;
                case "resize":
                    eventsPlayer.paintResize(data);
                    break;
                case "form":
                    eventsPlayer.paintFormChange(data);
                    break;
                default:
                    break;
            }

        });
    }
}

// let socket = io(SERVER.HttpHost,{transports:['polling','websocket']}); //'polling'
// let SocketID ="";
// socket.on('connect', function () {
//     console.log("socket 连接成功");
// });
// socket.on('id', function (msg) {
//     console.log("id：",msg);
//     SocketID = msg;
//     socket.emit("id",{id:SocketID,name:"worker"});
// });
let socket = new Socket();
export default socket;

