import { MutationRecordX } from '../interfaces'
import { RECORDER_ID } from './constants'
import snapShot from '../utils/SnapShot'
import { _log, _warn } from '../utils/tools'
import { Observer, DOMMutationRecord, DOMMutationTypes, NodeMutationData,MessageTypes } from '../interfaces/observer'
import { sendToServer } from '../utils/requestServer'


const { getRecordIdByElement } = snapShot

/**
 * Observe DOM change such as DOM-add/remove text-change attribute-change
 * and generate an Record
 */
export default class DOMMutationObserver implements Observer {
  private observer: MutationObserver

  constructor(options: boolean) {
    if (options === false) return
  }

  // when node's attribute change
  private getAttrReocrd({ attributeName, target }: MutationRecordX): DOMMutationRecord {
    let record = { attr: {} } as DOMMutationRecord
    record.target = getRecordIdByElement(target)

    if (record.target === undefined) return

    record.type = DOMMutationTypes.attr
    record.attr.key = attributeName
    record.attr.value = target.getAttribute(attributeName)

    return record
  }

  // when textNode's innerText change
  private getTextRecord({ target }: MutationRecordX): DOMMutationRecord {
    let record = {} as DOMMutationRecord
    record.type = DOMMutationTypes.text

    record.target = getRecordIdByElement(target)
    /**
     * 比如文本修改是在一个 contenteditable 的 `元素A` 内发生，
     * 并且 `元素A` 内有 textNode 和 element 同时存在，
     * 当只修改某个 textNode 时，MutationObserver 给的 target 会指向这个 textNode，
     * 所以 record.target 在上面代码中 getRecordIdByElement 时会取到 undefined (因为 document bufferer 字典内只缓存 element)，
     * 这时我们将 record.target 指向 `元素A` ，
     * record.html 取 `元素A` 的 innerHTML。
     */
    if (!record.target) {
      const parentEle = getRecordIdByElement(target.parentElement)
      /**
       * 如果这时候取不到 parentEle 或者 target.parentElement 为 null，则视该条记录作废
       * 这种情况会在删除整个 textNode 时发生，可以忽略，
       * 因为这个动作会额外的生成一个类型为 childList 的 MutationRecord
       * 交给 this.getNodesRecord 处理就好
       */
      if (!parentEle) {
        return
      }
      record.target = parentEle;
      record.html = target.parentElement.innerHTML;
      if(record.html==document.body.innerHTML){
        return null;
      }
    } else {
      // use textContent instend of innerText(non-standard),
      // see also https://stackoverflow.com/questions/35213147/difference-between-textcontent-vs-innertext
      record.text = target.textContent
    }
    return record
  }

  /**
   * @Either:
   * if node been added or removed,
   * @Or:
   * if a contenteditable textNode's text been all removed, type should be `childList`(remove #text),
   * later if you type/add some text in this empty textNode, the first mutation's type would be `childList`(add #text), fellows by `characterData`s
   */
  private getNodesRecord({
    target,
    addedNodes,
    removedNodes,
    previousSibling,
    nextSibling
  }: MutationRecordX): DOMMutationRecord {
    let record = { add: [], remove: [] } as DOMMutationRecord
    record.target = getRecordIdByElement(target)

    if (previousSibling) {
      record.prev = getRecordIdByElement(previousSibling)
    }
    if (nextSibling) {
      record.next = getRecordIdByElement(nextSibling)
    }
    /** ------------------------------ Add or Remove nodes --------------------------------- */
    const { length: isAdd } = addedNodes
    const { length: isRemove } = removedNodes

    if (!isAdd && !isRemove) return

    // add and remove node could happen in the same record
    record.type = DOMMutationTypes.node

    // Add element or textNode
    this.nodesFilter(addedNodes).forEach(
      (node): void => {
        let nodeData = {} as NodeMutationData
        switch (node.nodeName) {
          case '#text': {
              //TODO: 忽略nodeValue全部都是回车的情况
            nodeData.type = 'text'
            // add textNode
            // nodeValue: https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeValue
            nodeData.html = node.nodeValue
            if (target.childNodes.length) {
              nodeData.index = this.getNodeIndex(node.parentElement, node)
            }
            break
          }

          default: {
            nodeData.type = 'ele'
            const { parentElement, nodeValue } = node

            if (!parentElement) {
              // in case the node was the <html> element
              nodeData.html = nodeValue || node.outerHTML
              break
            }

            nodeData.index = this.getNodeIndex(parentElement, node)

            snapShot.bufferNewElement(node)

            nodeData.html = node.outerHTML
            snapShot.unmark(node, true)
          }
        }

        if (nodeData.html === null) return
        record.add.push(nodeData)
      }
    )

    // Remove element or textNode
    this.nodesFilter(removedNodes).forEach(
      (node): void => {
        let nodeData = {} as NodeMutationData

        switch (node.nodeName) {
          case '#text': {
            nodeData.type = 'text'
            const { parentElement } = node
            // 当删除一个 textNode 或 所有文本内容时
            // when delete the whole textNode
            if (parentElement) {
              nodeData.html = node.textContent
              nodeData.index = Array.prototype.slice.call(parentElement.childNodes).indexOf(node)
            } else {
              // 在这种情况下，没有 parentElement 的情况下我们无法获取到这个被删除textNode 节点的 index
              // 这时我们只能记录下它的 textContent 然后通过前后元素(previousSibling and nextSibling)来辅助定位，这个步骤在播放器里进行
              // on this occasion, we have no parentElement help us find
              // the index of node which was been removed,
              // we could only record the textContent and use previousSibling and nextSibling
              // for locating this node's index!   eg.[...prev, ->node<-, next...]
              nodeData.textContent = node.textContent
            }
            break
          }

          default: {
            nodeData.type = 'ele'
            nodeData.target = getRecordIdByElement(node)
            if (nodeData.target === undefined) return
          }
        }

        record.remove.push(nodeData)
      }
    )

    // filter record which's addNodes and removeNode only contain SCRIPT or COMMENT
    if (!record.remove.length && !record.add.length) return
    if (record.target === undefined) return

    if (!record.remove.length) {
      delete record.remove
    }

    if (!record.add.length) {
      delete record.add
    }

    return record
  }

  // filter out comment and script
  private nodesFilter(nodeList: NodeList): HTMLElement[] {
    return Array.prototype.slice.call(nodeList).filter(node => {
      const { nodeName, tagName } = node as HTMLElement
      return nodeName !== '#comment' && tagName !== 'SCRIPT'
    }) as HTMLElement[]
  }

  // get index of the node, attention that .childNodes return textNodes also
  private getNodeIndex(parentElement: HTMLElement, node: ChildNode) {
    return Array.prototype.slice.call(parentElement.childNodes).indexOf(node)
  }

  private process(mutationRecord: MutationRecordX) {
        try {
            const { target, attributeName } = mutationRecord

            // ignore script tag's mutation
            if (target && target.tagName === 'SCRIPT') return

            switch (mutationRecord.type) {
                case 'attributes': {
                    // ignore recorderId mutate
                    if (attributeName === RECORDER_ID) return
                    return this.getAttrReocrd(mutationRecord)
                }
                case 'characterData': {
                    return this.getTextRecord(mutationRecord)
                }
                case 'childList': {
                    return this.getNodesRecord(mutationRecord)
                }
                default: {
                    return
                }
            }
        } catch (error) {
            _warn(error)
        }
    }

  public install() {
    const mutationObserver = (window as any).MutationObserver || (window as any).WebKitMutationObserver

    this.observer = new mutationObserver((records: MutationRecord[]) => {
      for (let record of records) {
        const DOMMutationRecord = this.process(record as MutationRecordX)

        if (DOMMutationRecord) {
            //TODO: 重复内容的处理
            // console.log(DOMMutationRecord);
            sendToServer(MessageTypes.mutation,DOMMutationRecord).then(resData=>{
              console.log("mutation: ",resData);
            })
        }
      }
    });

    this.observer.observe(document.documentElement, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true
    });

    _log('mutation observer ready!')
  }

  public uninstall() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
  }
}
