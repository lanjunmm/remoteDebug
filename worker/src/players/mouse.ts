import snapShot from "../utils/SnapShot";

/**
 * replay mouse behavior
 * and produce an Record
 */
class MousePlayer{
    constructor() {
    }
    public replayClick(recordId){
        let ele = snapShot.getElementByRecordId(recordId);
        let event = document.createEvent('Event');
        event.initEvent('click', true, false);
        ele.dispatchEvent(event);
    }
}
let mousePlayer = new MousePlayer();
export default mousePlayer;
