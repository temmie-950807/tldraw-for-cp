import {
    StateNode,
    createShapeId,
    createBindingId,
    IndexKey,
    TLShape,
} from "tldraw"

import { CONTAINER_TYPE, CONTAINER_PADDING } from "./ContainerShapeUtil"
import { ELEMENT_SIZE } from "./ElementShapeUtil"
import { LAYOUT_TYPE } from "./LayoutBindingUtil"

export class DrawLayout extends StateNode {
    static override id = "layout"
    static override isLockable = true
    override shapeType = "draw"

    override onEnter = () => {
        this.editor.setCursor({ type: "cross", rotation: 0 })
    }

    override onPointerDown = () => {
        const { currentPagePoint } = this.editor.inputs

        // 檢查是否點擊在現有的容器上
        const hitShape = this.editor.getShapeAtPoint(currentPagePoint, {
            hitInside: true,
            filter: (shape: TLShape) => shape.type === CONTAINER_TYPE,
        })

        if (hitShape && hitShape.type === CONTAINER_TYPE) {
            // 點擊在容器上 → 在容器中新增一個 element
            this.addElementToContainer(hitShape.id)
        } else {
            // 點擊在空白處 → 建立一個新的空容器
            this.createEmptyContainer()
        }
    }

    private addElementToContainer(containerId: string) {
        // 取得容器現有的 bindings
        const existingBindings = this.editor
            .getBindingsFromShape(containerId as any, LAYOUT_TYPE)
            .sort((a: any, b: any) => (a.props.index > b.props.index ? 1 : -1))

        const newIndex = existingBindings.length

        // 建立新元素
        const elementId = createShapeId()
        const container = this.editor.getShape(containerId as any)
        if (!container) return

        this.editor.createShape({
            id: elementId,
            type: "element",
            x:
                container.x +
                CONTAINER_PADDING +
                newIndex * (ELEMENT_SIZE + CONTAINER_PADDING),
            y: container.y + CONTAINER_PADDING,
            props: { color: "black", fill: "semi", dash: "solid", size: "m", font: "mono" },
        })

        // 建立佈局綁定
        this.editor.createBinding({
            id: createBindingId(),
            type: LAYOUT_TYPE,
            fromId: containerId as any,
            toId: elementId,
            props: {
                index: `a${newIndex + 1}` as IndexKey,
                placeholder: false,
            },
        })
    }

    private createEmptyContainer() {
        const { currentPagePoint } = this.editor.inputs

        // 建立一個空容器（只有 padding 大小）
        const containerId = createShapeId()
        const containerWidth = CONTAINER_PADDING * 2 + ELEMENT_SIZE
        const containerHeight = CONTAINER_PADDING + ELEMENT_SIZE + CONTAINER_PADDING

        this.editor.createShape({
            id: containerId,
            type: CONTAINER_TYPE,
            x: currentPagePoint.x,
            y: currentPagePoint.y,
            props: {
                width: containerWidth,
                height: containerHeight,
            },
        })

        // 建立第一個元素
        const elementId = createShapeId()
        this.editor.createShape({
            id: elementId,
            type: "element",
            x: currentPagePoint.x + CONTAINER_PADDING,
            y: currentPagePoint.y + CONTAINER_PADDING,
            props: { color: "black", fill: "semi", dash: "solid", size: "m", font: "mono" },
        })

        // 建立綁定
        this.editor.createBinding({
            id: createBindingId(),
            type: LAYOUT_TYPE,
            fromId: containerId,
            toId: elementId,
            props: {
                index: "a1" as IndexKey,
                placeholder: false,
            },
        })
    }
}
