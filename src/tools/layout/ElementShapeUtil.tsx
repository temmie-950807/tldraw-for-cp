import {
    DefaultColorStyle,
    DefaultDashStyle,
    DefaultFillStyle,
    DefaultFontStyle,
    DefaultFontFamilies,
    DefaultSizeStyle,
    HTMLContainer,
    IndexKey,
    RecordProps,
    Rectangle2d,
    ShapeUtil,
    TLBaseShape,
    TLDefaultColorStyle,
    TLDefaultDashStyle,
    TLDefaultFillStyle,
    TLDefaultFontStyle,
    TLDefaultSizeStyle,
    TLShapeUtilCanBindOpts,
    Vec,
    clamp,
    createBindingId,
    getIndexBetween,
    useDefaultColorTheme,
    useEditor,
    useValue,
    TLRichText,
    RichTextArea,
    renderHtmlFromRichText,
    useEditableRichText,
    preventDefault,
} from "tldraw"

import {
    CONTAINER_PADDING,
    ContainerShape,
    CONTAINER_TYPE,
} from "./ContainerShapeUtil"
import { LayoutBinding } from "./LayoutBindingUtil"
import React, { useMemo } from "react"

const LAYOUT_TYPE = "layout"
const ELEMENT_TYPE = "element"
export const ELEMENT_SIZE = 100

const STROKE_SIZES: Record<TLDefaultSizeStyle, number> = {
    s: 2,
    m: 3.5,
    l: 5,
    xl: 10,
}

export type ElementShape = TLBaseShape<
    typeof ELEMENT_TYPE,
    {
        color: TLDefaultColorStyle
        fill: TLDefaultFillStyle
        dash: TLDefaultDashStyle
        size: TLDefaultSizeStyle
        font: TLDefaultFontStyle
        richText: TLRichText
    }
>

export class ElementShapeUtil extends ShapeUtil<ElementShape> {
    static override type = ELEMENT_TYPE

    static override props: RecordProps<ElementShape> = {
        color: DefaultColorStyle,
        fill: DefaultFillStyle,
        dash: DefaultDashStyle,
        size: DefaultSizeStyle,
        font: DefaultFontStyle,
        richText: {
            validate: (value: any) => value,
        } as any,
    }

    override getDefaultProps(): ElementShape["props"] {
        return {
            color: "black",
            fill: "none",
            dash: "solid",
            size: "m",
            font: "mono",
            richText: { type: "doc", content: [] },
        }
    }

    override canBind({
        fromShapeType,
        toShapeType,
        bindingType,
    }: TLShapeUtilCanBindOpts<ElementShape>) {
        return (
            fromShapeType === CONTAINER_TYPE &&
            toShapeType === ELEMENT_TYPE &&
            bindingType === LAYOUT_TYPE
        )
    }

    override canEdit() {
        return true
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

    override getGeometry() {
        return new Rectangle2d({
            width: ELEMENT_SIZE,
            height: ELEMENT_SIZE,
            isFilled: true,
        })
    }

    override component(shape: ElementShape) {
        return <ElementComponent shape={shape} />
    }

    override indicator() {
        return <rect rx={8} ry={8} width={ELEMENT_SIZE} height={ELEMENT_SIZE} />
    }

    private getTargetContainer(shape: ElementShape, pageAnchor: Vec) {
        return this.editor.getShapeAtPoint(pageAnchor, {
            hitInside: true,
            filter: (otherShape) =>
                this.editor.canBindShapes({
                    fromShape: otherShape,
                    toShape: shape,
                    binding: LAYOUT_TYPE,
                }),
        }) as ContainerShape | undefined
    }

    getBindingIndexForPosition(
        shape: ElementShape,
        container: ContainerShape,
        pageAnchor: Vec
    ) {
        const allBindings = this.editor
            .getBindingsFromShape<LayoutBinding>(container, LAYOUT_TYPE)
            .sort((a, b) => (a.props.index > b.props.index ? 1 : -1))

        const siblings = allBindings.filter((b) => b.toId !== shape.id)

        const order = clamp(
            Math.round(
                (pageAnchor.x - container.x - CONTAINER_PADDING) /
                (ELEMENT_SIZE + CONTAINER_PADDING)
            ),
            0,
            siblings.length + 1
        )

        const belowSib = allBindings[order - 1]
        const aboveSib = allBindings[order]

        let index: IndexKey

        if (belowSib?.toId === shape.id) {
            index = belowSib.props.index
        } else if (aboveSib?.toId === shape.id) {
            index = aboveSib.props.index
        } else {
            index = getIndexBetween(belowSib?.props.index, aboveSib?.props.index)
        }

        return index
    }

    override onTranslateStart(shape: ElementShape) {
        this.editor.updateBindings(
            this.editor
                .getBindingsToShape<LayoutBinding>(shape, LAYOUT_TYPE)
                .map((binding) => ({
                    ...binding,
                    props: { ...binding.props, placeholder: true },
                }))
        )
    }

    override onTranslate(_: ElementShape, shape: ElementShape) {
        const pageAnchor = this.editor
            .getShapePageTransform(shape)
            .applyToPoint({ x: ELEMENT_SIZE / 2, y: ELEMENT_SIZE / 2 })

        const targetContainer = this.getTargetContainer(shape, pageAnchor)

        if (!targetContainer) {
            const bindings = this.editor.getBindingsToShape<LayoutBinding>(
                shape,
                LAYOUT_TYPE
            )
            this.editor.deleteBindings(bindings)
            return
        }

        const index = this.getBindingIndexForPosition(
            shape,
            targetContainer,
            pageAnchor
        )

        const existingBinding = this.editor
            .getBindingsFromShape<LayoutBinding>(targetContainer, LAYOUT_TYPE)
            .find((b) => b.toId === shape.id)

        if (existingBinding) {
            if (existingBinding.props.index === index) return

            this.editor.updateBinding({
                ...existingBinding,
                props: {
                    ...existingBinding.props,
                    placeholder: true,
                    index,
                },
            })
        } else {
            this.editor.createBinding({
                id: createBindingId(),
                type: LAYOUT_TYPE,
                fromId: targetContainer.id,
                toId: shape.id,
                props: {
                    index,
                    placeholder: true,
                },
            })
        }
    }

    override onTranslateEnd(_: ElementShape, shape: ElementShape) {
        const pageAnchor = this.editor
            .getShapePageTransform(shape)
            .applyToPoint({ x: ELEMENT_SIZE / 2, y: ELEMENT_SIZE / 2 })

        const targetContainer = this.getTargetContainer(shape, pageAnchor)

        if (!targetContainer) return

        const index = this.getBindingIndexForPosition(
            shape,
            targetContainer,
            pageAnchor
        )

        this.editor.deleteBindings(
            this.editor.getBindingsToShape<LayoutBinding>(shape, LAYOUT_TYPE)
        )

        this.editor.createBinding({
            id: createBindingId(),
            type: LAYOUT_TYPE,
            fromId: targetContainer.id,
            toId: shape.id,
            props: {
                index,
                placeholder: false,
            },
        })
    }
}

// --- React Component ---

function ElementComponent({ shape }: { shape: ElementShape }) {
    const editor = useEditor()
    const theme = useDefaultColorTheme()

    // 使用 useValue 來 reactively 追蹤編輯狀態
    const isEditing = useValue(
        "isEditing",
        () => editor.getEditingShapeId() === shape.id,
        [editor, shape.id]
    )

    const isSelected = useValue(
        "isSelected",
        () => editor.getSelectedShapeIds().includes(shape.id),
        [editor, shape.id]
    )

    // 計算此 element 在容器中的 0-based 陣列索引
    const arrayIndex = useValue(
        "element array index",
        () => {
            const bindings = editor.getBindingsToShape<LayoutBinding>(shape, LAYOUT_TYPE)
            if (bindings.length === 0) return -1

            const binding = bindings[0]
            const containerId = binding.fromId

            const allBindings = editor
                .getBindingsFromShape<LayoutBinding>(containerId as any, LAYOUT_TYPE)
                .sort((a, b) => (a.props.index > b.props.index ? 1 : -1))

            return allBindings.findIndex((b) => b.toId === shape.id)
        },
        [editor, shape.id]
    )

    const { color, fill, dash, size, font, richText } = shape.props

    const themeColor = theme[color as keyof typeof theme]
    const semiColor =
        typeof themeColor === "object" && themeColor !== null
            ? (themeColor as any).semi
            : undefined
    const solidColor =
        typeof themeColor === "object" && themeColor !== null
            ? (themeColor as any).solid
            : theme.text
    const patternColor =
        typeof themeColor === "object" && themeColor !== null
            ? (themeColor as any).pattern
            : undefined
    const strokeColor = solidColor
    const strokeWidth = STROKE_SIZES[size]

    let bgColor = "transparent"
    const showPattern = fill === "pattern"

    if (fill === "solid") {
        bgColor = semiColor || "rgba(0,0,0,0.1)"
    } else if (fill === "semi") {
        bgColor = "white"
    } else if (fill === "pattern") {
        bgColor = semiColor || "rgba(0,0,0,0.1)"
    }

    const patternId = `pattern-${shape.id}`

    // 使用 tldraw 的 useEditableRichText hook（內建 isEditing 等 reactive 狀態）
    const {
        rInput,
        isEmpty,
        handleFocus,
        handleBlur,
        handleKeyDown,
        handleChange,
        handleInputPointerDown,
        handleDoubleClick,
        handlePaste,
        isReadyForEditing,
    } = useEditableRichText(shape.id, ELEMENT_TYPE, richText)

    // 渲染靜態 HTML（非編輯模式時顯示）
    const html = useMemo(() => {
        if (richText) {
            return renderHtmlFromRichText(editor, richText)
        }
        return ""
    }, [editor, richText])

    const textColor = fill === "solid" ? (theme.background || "#fff") : strokeColor

    return (
        <HTMLContainer
            style={{
                width: ELEMENT_SIZE,
                height: ELEMENT_SIZE,
                pointerEvents: "all",
                overflow: "visible",
            }}
        >
            {/* 0-based 陣列索引標籤 — 顯示在方塊左上角外側 */}
            {arrayIndex >= 0 && (
                <div
                    style={{
                        position: "absolute",
                        top: -20,
                        left: 0,
                        fontSize: "12px",
                        fontFamily: "var(--tl-font-mono)",
                        color: theme.text,
                        lineHeight: "16px",
                        pointerEvents: "none",
                        userSelect: "none",
                        whiteSpace: "nowrap",
                    }}
                >
                    {arrayIndex}
                </div>
            )}
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "8px",
                    border: `${strokeWidth}px ${dash === "draw" ? "solid" : dash === "dashed" ? "dashed" : dash === "dotted" ? "dotted" : "solid"} ${strokeColor}`,
                    backgroundColor: bgColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxSizing: "border-box",
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                {/* Pattern 填充：交叉線圖案覆蓋層 */}
                {showPattern && (
                    <svg
                        style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            pointerEvents: "none",
                        }}
                    >
                        <defs>
                            <pattern
                                id={patternId}
                                patternUnits="userSpaceOnUse"
                                width="8"
                                height="8"
                                patternTransform="rotate(45)"
                            >
                                <line
                                    x1="0" y1="0" x2="0" y2="8"
                                    stroke={patternColor || solidColor}
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    opacity="0.82"
                                />
                            </pattern>
                        </defs>
                        <rect
                            x="0" y="0"
                            width="100%"
                            height="100%"
                            fill={`url(#${patternId})`}
                            rx="6" ry="6"
                        />
                    </svg>
                )}
                {/* 文字區域 — 使用 tldraw 的 RichTextLabel 模式 */}
                {(!isEmpty || isEditing) && (
                    <div
                        className="tl-text-label tl-text-wrapper tl-rich-text-wrapper"
                        data-hastext={!isEmpty}
                        data-isediting={isEditing}
                        data-isselected={isSelected}
                        style={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            zIndex: 1,
                        }}
                    >
                        <div
                            className="tl-text-label__inner tl-text-content__wrapper"
                            style={{
                                fontSize: "14px",
                                lineHeight: "1.35",
                                minHeight: "19px",
                                color: textColor,
                                fontFamily: DefaultFontFamilies[font],
                                width: "100%",
                                textAlign: "center",
                            }}
                        >
                            {/* 靜態 HTML 渲染（非編輯模式） */}
                            <div
                                className="tl-text tl-text-content"
                                dir="auto"
                            >
                                {richText && (
                                    <div
                                        className="tl-rich-text"
                                        dangerouslySetInnerHTML={{ __html: html || "" }}
                                        onPointerDown={(e: React.PointerEvent) => {
                                            // 防止連結點擊時的事件傳播
                                            if (
                                                e.target instanceof HTMLElement &&
                                                (e.target.tagName === "A" || e.target.closest("a"))
                                            ) {
                                                preventDefault(e as any)
                                            }
                                        }}
                                    />
                                )}
                            </div>
                            {/* TipTap 富文字編輯器（編輯模式） */}
                            {(isReadyForEditing || isSelected) && (
                                <RichTextArea
                                    ref={rInput}
                                    richText={richText}
                                    isEditing={isEditing}
                                    shapeId={shape.id}
                                    handleFocus={handleFocus}
                                    handleChange={handleChange}
                                    handleBlur={handleBlur}
                                    handleKeyDown={handleKeyDown}
                                    handleDoubleClick={handleDoubleClick}
                                    handlePaste={handlePaste}
                                    handleInputPointerDown={handleInputPointerDown}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </HTMLContainer>
    )
}
