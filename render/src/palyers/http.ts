import {HTTP} from '../interfaces/types'
import {HttpReqMsgs} from '../interfaces/types'
import {FetchResponse,XMLResponse} from '../utils/constants'


class HttpPlayer implements HTTP{
    constructor(){

    }
    public fetch(reqMsg:HttpReqMsgs){
        return new Promise((res)=>{
            fetch(reqMsg.data.firstArg.url,reqMsg.data.secondArg).then((data)=>{
                let responseData = {};
                let resKeys = Object.keys(FetchResponse);
                data.json().then(resBody=>{
                    responseData["body"]= resBody;
                    for(let i=0;i<resKeys.length;i++){
                        if(resKeys[i]!='body'){
                            responseData[resKeys[i]] = data[resKeys[i]];
                        }
                    }
                    res(responseData);
                });
            })
        })
    }

   public sendbeacon(reqMsg: HttpReqMsgs){
        return new Promise((res)=>{
            let status = navigator.sendBeacon(reqMsg.data.url, reqMsg.data.data);
            res({"status":status});
        })
   }
   public xhr(reqMsg: HttpReqMsgs){
       return new Promise((res)=>{
           let xhr = new XMLHttpRequest();
           //TODO:onreadystatechange
           xhr.onreadystatechange=function(){
               if(xhr.readyState==4){
                   let xhrRes = {}
                   let resKeys = Object.keys(XMLResponse);
                   for(let i=0;i<resKeys.length;i++){
                           xhrRes[resKeys[i]] = xhr[resKeys[i]];
                   }
                   res(xhrRes);
                   console.log("xhrRes",xhrRes)
               }
           }
           xhr.open(reqMsg.data.method,reqMsg.data.url,reqMsg.data.async);
           let headerKey = Object.keys(reqMsg.data.headers);
           for(let i =0;i<headerKey.length;i++){
               let key = headerKey[i];
               let value = reqMsg.data.headers[headerKey[i]];
               xhr.setRequestHeader(key,value);
           }
           xhr.send(reqMsg.data.body);
       })
    }
}

let httpPlayer = new HttpPlayer();
export default httpPlayer
