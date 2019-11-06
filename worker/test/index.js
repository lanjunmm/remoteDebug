/** npm run dev 使用法*/
import Worker from '../src/index'
let worker = new Worker({mouse:{mousemove:true},iframe:false});
worker.start();

/** 打包后调用法：*/
// let worker = new window.worker();
// worker.start();

function testNetwork(){
    let url = 'http://www.mocky.io/v2/5ce3e1d231000062387429e5';
    // var myHeaders = new Headers();
    // myHeaders.append('Content-Type', 'text/xml');
    // var myInit:RequestInit = { method: 'GET',
    //     headers: myHeaders,
    //     mode: 'cors',
    //     cache: 'default'};
    // var myRequest = new Request(url,{method:"Get"});
    // fetch(myRequest,myInit).then(function(response) {
    //     console.log('fetch res: ',response);
    //     // response.json().then(dataJson=>{
    //     //     console.log(dataJson)
    //     // })
    // });

    let status = navigator.sendBeacon(url, "de");
    console.log("Beacon status",status);

    fetch(url).then(data=>{
        data.text().then(dataJson=>{
            console.log("Fetch收到Server：",dataJson)
        })
    });

    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange=function() {
        if (xhr.readyState==4 && xhr.status==200)
        {
            console.log("xhr收到Server：",xhr.responseText);
        }
    }
    xhr.open("GET", url);//"http://localhost:3000/trans"
    xhr.setRequestHeader("Content-Type","text/html")
    xhr.send("wwww");

}
function start(){
    console.log("aaaaaaaaaaaa")
    let  p=document.createElement('p');
    p.innerHTML="好菜呜呜呜";
    document.body.appendChild(p);

    document.getElementById('addEle').addEventListener('click', () => {
        let p = document.createElement('p');
        p.appendChild(document.createTextNode('加我一个！'));
        document.getElementById('addedElements').appendChild(p)
    });
    // 发起Jsonp请求
    document.getElementById("reqJson").addEventListener('click',()=>{
        let url="http://www.mocky.io/v2/5cdaa37f300000500068c8c8Add?callback=hello";
        let ele = document.createElement("script");

        let attr = document.createAttribute('src');
        attr.value=url;
        ele.setAttributeNode(attr);

        // ele.src="";
        // console.log(ele.attributes)
        // for(let i=0;i<ele.attributes.length;i++){
        //     if(ele.attributes[i].name=="src"){
        //         ele.attributes[i].value = url;
        //     }
        // }
        document.getElementsByTagName('body')[0].appendChild(ele);
    });
    document.getElementById("reqJson2").addEventListener('click',()=>{
        let url2 = 'http://www.mocky.io/v2/5ce3e1d231000062387429e5?callback=hello';
        let ele = document.createElement("script");
        // ele.src = url2;
        ele.setAttribute('src',url2);
        document.getElementsByTagName('body')[0].appendChild(ele);
    });
    document.getElementById("start").addEventListener('click',()=>{
        worker.start();
    });
    document.getElementById("stop").addEventListener('click',()=>{
        worker.stop();
    });
    // document.getElementById("iframe").addEventListener('click',()=>{
    //     let url="http://localhost:3000/testifr";
    //     let ele = document.createElement("iframe");
    //     ele.src = url;
    //     document.getElementsByTagName('body')[0].appendChild(ele);
    // });
    document.getElementById("fetch").addEventListener('click',()=>{
        let url = 'http://www.mocky.io/v2/5ce3e1d231000062387429e5';
        fetch(url).then(data=>{
            console.log("fetch Response:",data);
            data.text().then(dataJson=>{
                console.log("Fetch收到Server：",dataJson)
            })
        });
    });
    document.getElementById("beacon").addEventListener('click',()=>{
        let url = 'http://www.mocky.io/v2/5ce3e1d231000062387429e5';
        navigator.sendBeacon(url, "de");
    });
    document.getElementById("xhr").addEventListener('click',()=>{
        let url = 'http://www.mocky.io/v2/5ce3e1d231000062387429e5';
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange=function() {
            if (xhr.readyState===4 && xhr.status===200) {
                console.log("xhr收到Server：",xhr.response);
            }
        }
        xhr.open("GET", url);//"http://localhost:3000/trans"
        xhr.setRequestHeader("Content-Type","text/html")
        xhr.send("wwww");
    });
    document.getElementById("addclass").addEventListener('click',()=>{
        let addClass = document.getElementById("addclass");
        addClass.setAttribute('class',"red");
    });
    document.getElementById("changeStyle").addEventListener('click',()=>{
        let changeDiv = document.getElementById("change");
        changeDiv.style.backgroundImage="linear-gradient(#FC354C,#0ABFBC)";
    });
    // testNetwork();
}



document.addEventListener('DOMContentLoaded', start);


