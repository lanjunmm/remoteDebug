import {EventReocrd} from '../interfaces/observer';
import snapShot from "../utils/SnapShot";

class EventsPlayer {
    constructor() {
    }
    public  paintResize(record): void {
        const { w, h } = record;
        //@ts-ignore
        document.documentElement.width = w + 'px';
        //@ts-ignore
        document.documentElement.height = h + 'px';

        // window.resizeTo(w, h); // 在chrome中window.resize只在window.open方法中打开的窗口起作用
        // document.body.style.width = w + 'px';
        // document.body.style.height = h + 'px';
    }
    public paintScroll(record): void {
        // console.log(record)
        const { x, y, target } = record;

        if (target) {
            const targetEle = target && snapShot.getElementByRecordId(target);
            if (targetEle) {
                targetEle.scrollTop = y!;
                targetEle.scrollLeft = x!;
            }
        } else {
           const isStandardsMode = document.compatMode === 'CSS1Compat'
           if(isStandardsMode){
               document.documentElement.scrollLeft=x;
               document.documentElement.scrollTop=y;
               return;
           }else {
               document.body.scrollLeft = x;
               document.body.scrollTop = y;
           }
        }
    }

    public paintFormChange(record: EventReocrd): void {
        const { k, v, target } = record;
        const targetEle = target && snapShot.getElementByRecordId(target);

        if (targetEle) {
            targetEle[k!] = v;
        }
    }
}
let eventsPlayer = new EventsPlayer();
export default eventsPlayer;
