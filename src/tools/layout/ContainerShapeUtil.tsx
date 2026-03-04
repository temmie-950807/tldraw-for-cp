import {
    DefaultFontStyle,
    HTMLContainer,
    IndexKey,
    RecordProps,
    Rectangle2d,
    ShapeUtil,
    T,
    TLBaseShape,
    TLDefaultFontStyle,
    TLShapeUtilCanBindOpts,
    createBindingId,
    createShapeId,
    getIndexAbove,
    useEditor,
    useValue,
} from "tldraw"

import { ELEMENT_SIZE } from "./ElementShapeUtil"
import { LAYOUT_TYPE, LayoutBinding } from "./LayoutBindingUtil"
import React, { useCallback } from "react"

export const CONTAINER_TYPE = "container"
export const CONTAINER_PADDING = 24

export type ContainerShape = TLBaseShape<
    typeof CONTAINER_TYPE,
    { height: number; width: number; indexOffset: number; splitBySpace: boolean; inputText: string; font: TLDefaultFontStyle }
>

export class ContainerShapeUtil extends ShapeUtil<ContainerShape> {
    static override type = CONTAINER_TYPE

    static override props: RecordProps<ContainerShape> = {
        height: T.number,
        width: T.number,
        indexOffset: T.number,
        splitBySpace: T.boolean,
        inputText: T.string,
        font: DefaultFontStyle,
    }

    override getDefaultProps() {
        return {
            width: 100 + CONTAINER_PADDING * 2,
            height: 100 + CONTAINER_PADDING * 2,
            indexOffset: 0,
            splitBySpace: false,
            inputText: "",
            font: "mono" as TLDefaultFontStyle,
        }
    }

    override canBind({
        fromShapeType,
        toShapeType,
        bindingType,
    }: TLShapeUtilCanBindOpts<ContainerShape>) {
        return (
            fromShapeType === CONTAINER_TYPE &&
            toShapeType === "element" &&
            bindingType === "layout"
        )
    }

    override canEdit() {
        return false
    }

    override canResize() {
        return false
    }

    override hideRotateHandle() {
        return true
    }

    override isAspectRatioLocked() {
        return true
    }

    override getGeometry(shape: ContainerShape) {
        return new Rectangle2d({
            width: shape.props.width,
            height: shape.props.height,
            isFilled: true,
        })
    }

    override component(shape: ContainerShape) {
        return <ContainerComponent shape={shape} />
    }

    override indicator(shape: ContainerShape) {
        return (
            <rect
                rx={12}
                ry={12}
                width={shape.props.width}
                height={shape.props.height}
            />
        )
    }
}

// --- 按鈕樣式常數 ---
const BUTTON_SIZE = 28
const BUTTON_GAP = 8

const buttonBaseStyle: React.CSSProperties = {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: "50%",
    border: "1.5px solid #ccc",
    backgroundColor: "#f5f5f5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0,
    transition: "background-color 0.15s, border-color 0.15s",
    pointerEvents: "all",
}

// --- React 元件 ---

function ContainerComponent({ shape }: { shape: ContainerShape }) {
    const editor = useEditor()

    const isSelected = useValue(
        "isSelected",
        () => editor.getSelectedShapeIds().includes(shape.id),
        [editor, shape.id]
    )

    const handleClear = useCallback(
        (e: React.PointerEvent) => {
            e.stopPropagation()

            // 取得容器的所有 layout bindings
            const bindings = editor.getBindingsFromShape<LayoutBinding>(
                shape,
                LAYOUT_TYPE
            )

            if (bindings.length === 0) return

            // 收集所有綁定的 element shape IDs
            const elementIds = bindings.map((b) => b.toId)

            // 刪除 bindings 和 elements
            editor.deleteBindings(bindings)
            editor.deleteShapes(elementIds)
        },
        [editor, shape]
    )

    const handleAdd = useCallback(
        (e: React.PointerEvent) => {
            e.stopPropagation()

            // 取得容器現有的 bindings，按 index 排序
            const existingBindings = editor
                .getBindingsFromShape<LayoutBinding>(shape, LAYOUT_TYPE)
                .sort((a, b) => (a.props.index > b.props.index ? 1 : -1))

            // 計算新的 index key：取最後一個 binding 的 index 之後
            const lastBinding = existingBindings[existingBindings.length - 1]
            const newIndexKey = lastBinding
                ? getIndexAbove(lastBinding.props.index)
                : ("a1" as IndexKey)

            // 建立新元素（文字內容為空）
            const elementId = createShapeId()
            const positionCount = existingBindings.length

            editor.createShape({
                id: elementId,
                type: "element",
                x:
                    shape.x +
                    CONTAINER_PADDING +
                    positionCount * (ELEMENT_SIZE + CONTAINER_PADDING),
                y: shape.y + CONTAINER_PADDING,
                props: {
                    color: "black",
                    fill: "semi",
                    dash: "solid",
                    size: "m",
                    font: "mono",
                    richText: { type: "doc", content: [] },
                },
            })

            // 建立佈局綁定
            editor.createBinding({
                id: createBindingId(),
                type: LAYOUT_TYPE,
                fromId: shape.id,
                toId: elementId,
                props: {
                    index: newIndexKey,
                    placeholder: false,
                },
            })
        },
        [editor, shape]
    )

    return (
        <HTMLContainer
            style={{
                width: shape.props.width,
                height: shape.props.height,
                pointerEvents: "all",
                overflow: "visible",
            }}
        >
            {/* 容器背景 */}
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#efefef",
                    borderRadius: "12px",
                }}
            />

            {/* 下方清空按鈕 — 對齊第一個元素中間 */}
            {isSelected && (
                <button
                    onPointerDown={handleClear}
                    title="清空容器"
                    style={{
                        ...buttonBaseStyle,
                        position: "absolute",
                        left: CONTAINER_PADDING + ELEMENT_SIZE / 2 - BUTTON_SIZE / 2,
                        top: shape.props.height + BUTTON_GAP,
                    }}
                    onPointerEnter={(e) => {
                        const t = e.currentTarget
                        t.style.backgroundColor = "#fce4e4"
                        t.style.borderColor = "#e57373"
                    }}
                    onPointerLeave={(e) => {
                        const t = e.currentTarget
                        t.style.backgroundColor = "#f5f5f5"
                        t.style.borderColor = "#ccc"
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <line
                            x1="3" y1="3" x2="11" y2="11"
                            stroke="#888" strokeWidth="2" strokeLinecap="round"
                        />
                        <line
                            x1="11" y1="3" x2="3" y2="11"
                            stroke="#888" strokeWidth="2" strokeLinecap="round"
                        />
                    </svg>
                </button>
            )}

            {/* 上方新增按鈕 — 對齊第一個元素中間 */}
            {isSelected && (
                <button
                    onPointerDown={handleAdd}
                    title="新增元素"
                    style={{
                        ...buttonBaseStyle,
                        position: "absolute",
                        left: CONTAINER_PADDING + ELEMENT_SIZE / 2 - BUTTON_SIZE / 2,
                        top: -(BUTTON_SIZE + BUTTON_GAP),
                    }}
                    onPointerEnter={(e) => {
                        const t = e.currentTarget
                        t.style.backgroundColor = "#e0f2e9"
                        t.style.borderColor = "#66bb6a"
                    }}
                    onPointerLeave={(e) => {
                        const t = e.currentTarget
                        t.style.backgroundColor = "#f5f5f5"
                        t.style.borderColor = "#ccc"
                    }}
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <line
                            x1="7" y1="2" x2="7" y2="12"
                            stroke="#888" strokeWidth="2" strokeLinecap="round"
                        />
                        <line
                            x1="2" y1="7" x2="12" y2="7"
                            stroke="#888" strokeWidth="2" strokeLinecap="round"
                        />
                    </svg>
                </button>
            )}
        </HTMLContainer>
    )
}
