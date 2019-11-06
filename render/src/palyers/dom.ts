import DomTreeBufferer from './dom-bufferer';
import {DOMMutationRecord,MouseReocrd,EventRecord} from '../interfaces/types';
import { ElementX } from '../schemas/override';
import { RECORDER_ID } from '../utils/constants';
import initObserver from "../observer/index";

let { getElementByRecordId, bufferNewElement } = DomTreeBufferer;
getElementByRecordId = getElementByRecordId.bind(DomTreeBufferer);
bufferNewElement = bufferNewElement.bind(DomTreeBufferer);

class DomClass {
    public initialDomReady: boolean = false;
    public canvasWidth: number;
    public canvasHeight: number;
    public domLayer: HTMLIFrameElement;
    public canvas: HTMLElement;
    public mouse: HTMLElement;

    constructor() {

    }
    private wrapperTagMap: object = {
        tr: 'tbody',
        td: 'tr',
        th: 'tr',
        col: 'colgroup',
        colgroup: 'table',
        thead: 'table',
        tbody: 'table'
    };
    private createDoc(){
        let existCanvas = document.getElementsByTagName('section');
        if(existCanvas){
            let eles = Array.from(existCanvas);
            eles.forEach(item=>{
                document.body.removeChild(item);
            })
        }


        let canvas = document.createElement('section');
        canvas.style.position = "relative";

        let mouse = document.createElement('img');
        mouse.src = require("../assets/mouse.svg");
        mouse.style.position="absolute";

        let ifr = document.createElement('iframe');
        ifr.style.width="100%";
        ifr.style.height="100%";

        canvas.appendChild(mouse);
        canvas.appendChild(ifr);
        document.body.appendChild(canvas);

        this.mouse = mouse;
        this.canvas = canvas;
        this.domLayer = ifr;
        DomTreeBufferer.canvas = canvas;
        DomTreeBufferer.domLayer = ifr;
        return {canvas,ifr};
    }


    public renderSnapshot(data){
        let {ifr:domlayer} = this.createDoc(); //document
        DomTreeBufferer.fillTheDomLayerBySnapshot(
            domlayer,
            data.snapshot,
            data.referer
        ).then(_ => {
            this.initialDomReady = true;
        });
        this.paintResize(data.resize);
        this.paintScroll(data.scroll);
        /** 快照加载完成后，初始化观察对象*/
        initObserver.init();
    }
    public  paintResize(record): void {
        const { w, h } = record;
        this.canvasWidth = w;
        this.canvasHeight = h;

        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';

        // window.resizeTo(w, h); // 在chrome中window.resize只在window.open方法中打开的窗口起作用
        // document.body.style.width = w + 'px';
        // document.body.style.height = h + 'px';
    }
    public paintScroll(record): void {
        // console.log(record)
        const { x, y, target } = record;

        if (target) {
            const targetEle = target && DomTreeBufferer.getElementByRecordId(target);
            if (targetEle) {
                targetEle.scrollTop = y!;
                targetEle.scrollLeft = x!;
            }
        } else {
            const targetDocument = this.domLayer.contentDocument;
            if (targetDocument) {
                targetDocument.body.scrollLeft = x!;
                targetDocument.body.scrollTop = y!;
            }
            // document.body.scrollLeft = x; //document
            // document.body.scrollTop = y;
        }
    }

    public paintMouseMove(record: MouseReocrd): void {
        const { x, y } = record;

        this.mouse.style.top=`${y}px`;
        this.mouse.style.left=`${x}px`;
    }

   public paintMouseClick(record: MouseReocrd): void {
        console.log(record);
        // const { x, y } = record
    }

    public html2ElementOrText(html:string):ElementX{
        // list tags below need specific wapper Tag, ensuring not to lost original dom structure
        const matchRst = /^<(tr|td|th|col|colgroup|thead|tbody)[\s\S]*>[\w\W]*?<\/(tr|td|th|col|colgroup|thead|tbody)>$/g.exec(
            html
        );
        let wrapperTagName = 'div';

        if (matchRst && matchRst[1]) {
            wrapperTagName = this.wrapperTagMap[matchRst[1]];
        }

        const div = document.createElement(wrapperTagName);
        div.innerHTML = html;
        return div.firstChild as ElementX;
    }

    public  paintNodeAddorRemove(record: DOMMutationRecord): void {
        // console.log(record);
        const { add, remove, target, prev, next } = record;
        const parentEle = DomTreeBufferer.getElementByRecordId(target);

        if (parentEle) {
            if (add && add.length) {
                add.forEach(({ html, index, type}) => {
                    if (!html) return;
                    const eleToInsert = this.html2ElementOrText(html);
                    const eleRecordId = eleToInsert.getAttribute && eleToInsert.getAttribute(RECORDER_ID);

                    // 2. element may already existed in parentEle
                    if (parentEle.querySelector(`[${RECORDER_ID}="${eleRecordId}"]`)) {
                        return;
                    }

                    if (index || index === 0) {
                        // 1. css insert
                        if (parentEle.nodeName === 'STYLE') {
                            parentEle.innerHTML = html;
                            return;
                        }

                        // 3. the textContent does not change but you may receive an text node change
                        // which text is entirely equal as before
                        if (type === 'text' && html === parentEle.textContent) {
                            return;
                        }
                        // https://mdn.io/insertBefore
                        parentEle.insertBefore(eleToInsert, parentEle.childNodes[index]);
                        bufferNewElement(eleToInsert);
                    } else {
                        if (type === 'text') {
                            // html should be a textNode's textContent
                            // more: https://mdn.io/append
                            parentEle.append(html);
                        } else {
                            parentEle.appendChild(eleToInsert);
                        }
                    }
                });
            }

            if (remove && remove.length) {
                remove.forEach(({ target, textContent, index, type }) => {
                    // remove an element
                    if (target && type === 'ele') {
                        try {
                            const eleToRemove = getElementByRecordId(target);

                            eleToRemove && parentEle.removeChild(eleToRemove);
                        } catch (err) {
                            console.warn('Remove ele Error: ', record);
                        }
                        return;
                    }

                    // remove an textNode with specific index
                    if (index && type === 'text') {
                        try {
                            const eleToRemove = parentEle.childNodes[index];

                            eleToRemove && parentEle.removeChild(eleToRemove);
                        } catch (err) {
                            console.warn('Remove text Error: ', record);
                        }

                        return;
                    }

                    // remove a textNode
                    // textContent equal to " "  in most case :)
                    if (textContent && type === 'text') {
                        let prevEle;
                        let nextEle;

                        if (prev) {
                            prevEle = getElementByRecordId(prev);
                        }

                        if (next) {
                            prevEle = getElementByRecordId(next);
                        }

                        const textNodeToRemove = Array.from(parentEle.childNodes).find(
                            node => {
                                const isText = node.nodeName === '#text';
                                const isContentMatched = node.textContent === textContent;
                                const isPrevMatched = prevEle
                                    ? node.previousSibling === prevEle
                                    : true;

                                const isNextMatched = nextEle
                                    ? node.nextSibling === nextEle
                                    : true;

                                return (
                                    isText && isContentMatched && isPrevMatched && isNextMatched
                                );
                            }
                        );

                        textNodeToRemove && parentEle.removeChild(textNodeToRemove);
                    }
                });
            }
        }
    }

    public  paintAttributeMutate(record: DOMMutationRecord): void {
        const { attr, target } = record;
        const targetEle = getElementByRecordId(target);

        if (targetEle && attr) {
            // DO NOT TOUCH RECORDER-ID！
            if (attr.key === RECORDER_ID) {
                return;
            }
            targetEle.setAttribute(attr.key, attr.value);
        }
    }
    public  paintTextChange(record: DOMMutationRecord): void {
        const { text, html, target } = record;
        const targetEle = getElementByRecordId(target);

        if (targetEle) {
            if (html) {
                targetEle.innerHTML = html;
                return;
            }

            targetEle.textContent = text as string | null;
        }
    }
   public paintFormChange(record: EventRecord): void {
        const { k, v, target } = record;
        const targetEle = target && getElementByRecordId(target);

        if (targetEle) {
            targetEle[k!] = v;
        }
    }
}
const Dom = new DomClass();

export default Dom;
