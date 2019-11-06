import { ElementX, myWindow } from '../schemas/override';
import { _error, _warn } from '../utils/log';
import { RECORDER_ID } from '../utils/constants';

/**  1. 去除快照中的script元素和加载js文件的link元素
 *   2. 将快照中的所有元素都缓存为<node,id>和<id,node>
 *   3. 添加新元素缓存
 *   4. 添加<base>标签
 *   5. 重新加载：清除元素缓存
 * */
// TODO: merge into painter
class DomTreeBuffererClass {
    public pageSnapshot: string;
    public domLayer: HTMLIFrameElement;
    public canvas: HTMLElement;
    public referer: string;

    private RecorderId2Element: Map<number, ElementX> = new Map();
    private Element2RecorderId: Map<ElementX, number | null> = new Map();

    public getElementByRecordId(id: number): ElementX | undefined {
        return this.RecorderId2Element.get(id);
    }

    public getRecordIdByElement(ele: ElementX): number | null | undefined {
        return this.Element2RecorderId.get(ele);
    }

    private buffer(ele: ElementX): void {
        if (ele.getAttribute) {
            let recorderId = ele.getAttribute(RECORDER_ID);

            if (recorderId) {
                const id: number = parseInt(recorderId, 10);

                this.Element2RecorderId.set(ele, id);
                this.RecorderId2Element.set(id, ele);
            }
        }
    }

    public bufferNewElement = (ele: ElementX): void => {
        this.buffer(ele);

        const { children } = ele;
        if (children && children.length) {
            Array.from(children).forEach(this.bufferNewElement);
        }
    };

    private wash(snapshot: string): string {
        const escapeScriptTagReg = /<(script|noscript)[^>]*>[\s\S]*?<\/[^>]*(script|noscript)>/g;
        // link tag which preload/fetch a script
        const escapeLinkTagReg = /<link([^>]*js[^>]*)>/g;

        snapshot=snapshot.replace(escapeLinkTagReg, '');
        snapshot=snapshot.replace(escapeScriptTagReg, '');
        return snapshot;
    }

    private insertBaseTag(snapshot: string): string {
        const baseTag = `<base href="${this.referer}">`;
        const headTagReg = /<head[^>]*>/g;

        return snapshot.replace(headTagReg, `$& ${baseTag}`);
    }


    /** 将快照插入页面
     * */
    public fillTheDomLayerBySnapshot(
        domLayer: HTMLIFrameElement,
        pageSnapshot: string,
        referer: string
    ): Promise<boolean> {
        this.Element2RecorderId.clear();
        this.RecorderId2Element.clear();
        this.domLayer = domLayer;
        this.referer = referer;
        this.pageSnapshot = this.wash(pageSnapshot); // 对于script标签和加载了js的link标签的处理，直接替换不要
        this.pageSnapshot = this.insertBaseTag(this.pageSnapshot); // 插入<base href=referer>标签在head标签后面

        return new Promise((resolve, reject) => {
            // const layerDoc = domLayer;
            const layerDoc = domLayer.contentDocument;

            if (!layerDoc) {
                reject(false);
                _warn("document.body doesn't existed!");
                return;
            }

            try {
                // layerDoc.write(`<!DOCTYPE html>${this.pageSnapshot}`); // 在浏览器空闲时插入首次快照
                layerDoc.write(`${this.pageSnapshot}`); // 在浏览器空闲时插入首次快照

                // insert default css
                const playerDefaultStyle = layerDoc.createElement('style');
                playerDefaultStyle.setAttribute('type', 'text/css');
                playerDefaultStyle.innerHTML = `html {background: #fff;} noscript {display: none;}`;
                layerDoc.head!.insertBefore(
                    playerDefaultStyle,
                    layerDoc.head!.firstChild!
                );

                console.time('[Dom buffer]');
                Array.from(layerDoc.querySelectorAll('*')).forEach(
                    (ele: ElementX) => {
                        this.buffer(ele); // 按照<node,id>缓存元素在Element2RecorderId  按照<id,node>缓存RecorderId2Element,这两个都是map类型
                    }
                );
                console.timeEnd('[Dom buffer]');
                myWindow.__DOC_BUF__ = this;
                resolve(true);
            } catch (err) {
                // TODO: render failed message into Screen
                reject(false);
            }
        });
    }
}

const DomTreeBufferer = new DomTreeBuffererClass();

export default DomTreeBufferer;
