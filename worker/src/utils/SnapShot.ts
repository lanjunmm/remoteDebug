import { RECORDER_ID } from '../observers/constants'
import {SnapShoter,ElementX} from '../interfaces'


class SnapShot  implements SnapShoter{
    public map: Map<HTMLElement | Element | Node | EventTarget, number> = new Map();
    private RecorderId2Element: Map<number, ElementX> = new Map();
    public latestSnapshot: string
    public inited: boolean = false
    private id: number = 0 // self-increase id

    public takeSnapshotForPage(): string {
        console.time('[Snapshot for page]')

        // Note that textNodes wouldn't been included !!
        // 遍历DOM中的每个节点(除了textNode)，以<node,id>方式存在Map中，并为元素添加“recorder-id”属性
        Array.prototype.slice.call(document.querySelectorAll('*')).forEach(this.buffer)

        /** 第一次是index.html页面的源码的字符串表示 */
        this.latestSnapshot = document.documentElement.outerHTML

        // 为元素删除“recorder-id”属性
        Array.prototype.slice.call(document.querySelectorAll('*')).forEach((node: HTMLElement) => {
            this.unmark(node)
        })

        console.timeEnd('[Snapshot for page]')
        return this.latestSnapshot
    }
    private newId(): number {
        this.id += 1
        return this.id
    }

    // mark recorderId on non-textnode
    public mark(ele: ElementX, id): void {
        ele.setAttribute(RECORDER_ID, id)
    }

    // remove recorderId on non-textnode
    public unmark(ele: ElementX, isDeep: boolean = false): void {
        const { removeAttribute } = ele
        removeAttribute && ele.removeAttribute(RECORDER_ID)

        if (isDeep && ele.childElementCount) {
            Array.prototype.slice.call(ele.children).forEach(chEle => this.unmark(chEle))
        }
    }

    private buffer = (ele: ElementX): number => {
        let recorderId = this.map.get(ele) || this.newId()
        this.map.set(ele, recorderId);
        this.RecorderId2Element.set(recorderId, ele);

        this.mark(ele, recorderId)
        return recorderId
    }

    // if document have new node, use this method because that node may have childElement
    public bufferNewElement = (ele: ElementX): void => {
        this.buffer(ele)

        if (ele.childElementCount) {
            // element.children retun childElements without textNodes
            Array.prototype.slice.call(ele.children).forEach(chEle => this.bufferNewElement(chEle))
        }
    }

    // get recorderId from map by element
    public getRecordIdByElement = (ele: ElementX | EventTarget): number | undefined => {
        return this.map.get(ele)
    }
    public getElementByRecordId(id: number): ElementX | undefined {
        let ele = this.RecorderId2Element.get(id);
        return ele;
    }
}

const snapShot = new SnapShot()
export default snapShot
