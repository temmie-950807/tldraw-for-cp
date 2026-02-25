import {
    StateNode,
    createShapeId,
    createBindingId,
    IndexKey,
} from "tldraw"

const PASTEL_COLORS = [
    "#AEC6CF", // 淡藍
    "#FFB7B2", // 淡珊瑚
    "#B5EAD7", // 淡綠
    "#FFDAC1", // 淡橙
    "#E2F0CB", // 淡黃綠
    "#C7CEEA", // 淡紫
    "#F3B0C3", // 淡粉
    "#C6DEF1", // 淡天藍
]

const CONTAINER_PADDING = 24
const ELEMENT_SIZE = 100

export class DrawLayout extends StateNode {
    static override id = "layout"
    static override isLockable = true
    override shapeType = "draw"

    private colorIndex = 0

    override onEnter = () => {
        this.editor.setCursor({ type: "cross", rotation: 0 })
    }

    override onPointerDown = () => {
        const { currentPagePoint } = this.editor.inputs
        const numElements = 3 // 預設建立 3 個元素的容器

        // 建立容器
        const containerId = createShapeId()
        const containerWidth =
            CONTAINER_PADDING +
            numElements * ELEMENT_SIZE +
            (numElements - 1) * CONTAINER_PADDING +
            CONTAINER_PADDING
        const containerHeight =
            CONTAINER_PADDING + ELEMENT_SIZE + CONTAINER_PADDING

        this.editor.createShape({
            id: containerId,
            type: "container",
            x: currentPagePoint.x,
            y: currentPagePoint.y,
            props: {
                width: containerWidth,
                height: containerHeight,
            },
        })

        // 建立元素並綁定到容器
        for (let i = 0; i < numElements; i++) {
            const elementId = createShapeId()
            const color =
                PASTEL_COLORS[this.colorIndex % PASTEL_COLORS.length]
            this.colorIndex++

            this.editor.createShape({
                id: elementId,
                type: "element",
                x:
                    currentPagePoint.x +
                    CONTAINER_PADDING +
                    i * (ELEMENT_SIZE + CONTAINER_PADDING),
                y: currentPagePoint.y + CONTAINER_PADDING,
                props: {
                    color,
                },
            })

            // 建立佈局綁定
            this.editor.createBinding({
                id: createBindingId(),
                type: "layout",
                fromId: containerId,
                toId: elementId,
                props: {
                    index: `a${i + 1}` as IndexKey,
                    placeholder: false,
                },
            })
        }
    }
}
