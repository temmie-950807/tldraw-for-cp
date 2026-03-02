import {
    DefaultColorStyle,
    DefaultDashStyle,
    DefaultFillStyle,
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
    TLDefaultSizeStyle,
    TLShapeUtilCanBindOpts,
    Vec,
    clamp,
    createBindingId,
    getIndexBetween,
    useDefaultColorTheme,
    useEditor,
    TLRichText,
} from "tldraw"

import {
    CONTAINER_PADDING,
    ContainerShape,
    CONTAINER_TYPE,
} from "./ContainerShapeUtil"
import { LayoutBinding } from "./LayoutBindingUtil"
import { useEditableRichText } from "tldraw"

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
    const isEditing = editor.getEditingShapeId() === shape.id

    const { color, fill, dash, size, richText } = shape.props

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

    // 根據四種填充樣式決定背景
    // none: 透明
    // semi: 使用主題的 semi 色（半透明淺色）
    // solid: 使用主題的 solid 色（實心色，與邊框同色）
    // pattern: 使用主題的 semi 色作為底色 + 交叉線圖案（使用 pattern 色）
    let bgColor = "transparent"
    const showPattern = fill === "pattern"

    if (fill === "solid") {
        bgColor = semiColor || "rgba(0,0,0,0.1)"
    } else if (fill === "semi") {
        bgColor = "white"
    } else if (fill === "pattern") {
        bgColor = semiColor || "rgba(0,0,0,0.1)"
    }
    // fill === "none" → transparent

    const patternId = `pattern-${shape.id}`

    const {
        rInput,
        isEmpty,
        handleFocus,
        handleBlur,
        handleKeyDown,
    } = useEditableRichText(shape.id, ELEMENT_TYPE, richText)

    return (
        <HTMLContainer
            style={{
                width: ELEMENT_SIZE,
                height: ELEMENT_SIZE,
                pointerEvents: "all",
            }}
        >
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
                {(isEditing || !isEmpty) && (
                    <div
                        ref={rInput as any}
                        className="tl-rich-text"
                        style={{
                            width: ELEMENT_SIZE - strokeWidth * 2 - 8,
                            height: ELEMENT_SIZE - strokeWidth * 2 - 8,
                            color: fill === "solid" ? (theme.background || "#fff") : strokeColor,
                            fontSize: "14px",
                            fontFamily: "var(--tl-font-mono)",
                            textAlign: "center",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            outline: "none",
                            pointerEvents: isEditing ? "all" : "none",
                            userSelect: isEditing ? "text" : "none",
                            padding: "4px",
                            overflow: "hidden",
                            wordBreak: "break-word",
                            position: "relative",
                            zIndex: 1,
                        }}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown as any}
                    />
                )}
            </div>
        </HTMLContainer>
    )
}
