import {
    DefaultColorStyle,
    DefaultFontStyle,
    DefaultSizeStyle,
    DefaultTextAlignStyle,
    Editor,
    FONT_FAMILIES,
    FONT_SIZES,
    RecordProps,
    Rectangle2d,
    ShapeUtil,
    StateNode,
    T,
    TEXT_PROPS,
    TLBaseShape,
    TLDefaultColorStyle,
    TLDefaultFontStyle,
    TLDefaultSizeStyle,
    TLDefaultTextAlignStyle,
    TLResizeInfo,
    TLShapeId,
    TextLabel,
    Vec,
    WeakCache,
    toDomPrecision,
    useDefaultColorTheme,
    useEditor,
} from "tldraw"
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import "../index.css";

interface LatexShapeProps {
    color: TLDefaultColorStyle
    size: TLDefaultSizeStyle
    font: TLDefaultFontStyle
    textAlign: TLDefaultTextAlignStyle
    w: number
    text: string
    scale: number
    autoSize: boolean
}

type LatexShape = TLBaseShape<"latex-text", LatexShapeProps>
const sizeCache = new WeakCache<LatexShape['props'], { height: number; width: number }>()

export class LatexUtil extends ShapeUtil<LatexShape> {
    static override type = "latex-text" as const
    static override props: RecordProps<LatexShape> = {
        color: DefaultColorStyle,
        size: DefaultSizeStyle,
        font: DefaultFontStyle,
        textAlign: DefaultTextAlignStyle,
        w: T.nonZeroNumber,
        text: T.string,
        scale: T.nonZeroNumber,
        autoSize: T.boolean,
    }

    getDefaultProps(): LatexShape["props"] {
        return {
            color: "black",
            size: "m",
            font: "draw",
            textAlign: "start",
            w: 80,
            text: "",
            scale: 1,
            autoSize: true,
        }
    }

    getMinDimensions(shape: LatexShape) {
        return sizeCache.get(shape.props, () => getTextSize(this.editor, shape.props))
    }

    getGeometry(shape: LatexShape) {
        const { id } = shape
        const element_width: any = document.querySelector(`[data-shape-id="${id}"] > span > div > mjx-container`)
        const element_height: any = document.querySelector(`[data-shape-id="${id}"] > span`)

        if (element_height === null || element_width === null) {
            return new Rectangle2d({
                width: 50,
                height: 50,
                isFilled: true, // 不知道在幹嘛
                isLabel: true, // 不知道在幹嘛
            })
        }
        
        const width = element_width.getBoundingClientRect().width
        const height = element_height.getBoundingClientRect().height
        return new Rectangle2d({
            width: width,
            height: height,
            isFilled: true, // 不知道在幹嘛
            isLabel: true, // 不知道在幹嘛
        })
    }

    override getText(shape: LatexShape) {
        return shape.props.text
    }

    override canEdit() {
        return true
    }

    override isAspectRatioLocked() {
        return true
    } // WAIT NO THIS IS HARD CODED IN THE RESIZE HANDLER

    override onResize(shape: LatexShape, info: TLResizeInfo<LatexShape>) {
        const { newPoint, initialBounds, initialShape, scaleX, handle } = info

        if (info.mode === 'scale_shape' || (handle !== 'right' && handle !== 'left')) {
            return {
                id: shape.id,
                type: shape.type,
                ...resizeScaled(shape, info),
            }
        } else {
            const nextWidth = Math.max(1, Math.abs(initialBounds.width * scaleX))
            const { x, y } =
                scaleX < 0 ? Vec.Sub(newPoint, Vec.FromAngle(shape.rotation).mul(nextWidth)) : newPoint

            return {
                id: shape.id,
                type: shape.type,
                x,
                y,
                props: {
                    w: nextWidth / initialShape.props.scale,
                    autoSize: false,
                },
            }
        }
    }

    override onEditEnd(shape: LatexShape) {
        const {
            id,
            type,
            props: { text },
        } = shape

        const trimmedText = shape.props.text.trimEnd()

        if (trimmedText.length === 0) {
            this.editor.deleteShapes([shape.id])
        } else {
            if (trimmedText !== shape.props.text) {
                this.editor.updateShapes([
                    {
                        id,
                        type,
                        props: {
                            text: text.trimEnd(),
                        },
                    },
                ])
            }
        }
    }

    override onBeforeUpdate(prev: LatexShape, next: LatexShape) {
        if (!next.props.autoSize) return

        const styleDidChange =
            prev.props.size !== next.props.size ||
            prev.props.textAlign !== next.props.textAlign ||
            prev.props.font !== next.props.font ||
            (prev.props.scale !== 1 && next.props.scale === 1)

        const textDidChange = prev.props.text !== next.props.text

        // Only update position if either changed
        if (!styleDidChange && !textDidChange) return

        // Might return a cached value for the bounds
        const boundsA = this.getMinDimensions(prev)

        // Will always be a fresh call to getTextSize
        const boundsB = getTextSize(this.editor, next.props)

        const wA = boundsA.width * prev.props.scale
        const hA = boundsA.height * prev.props.scale
        const wB = boundsB.width * next.props.scale
        const hB = boundsB.height * next.props.scale

        let delta: Vec | undefined

        switch (next.props.textAlign) {
            case 'middle': {
                delta = new Vec((wB - wA) / 2, textDidChange ? 0 : (hB - hA) / 2)
                break
            }
            case 'end': {
                delta = new Vec(wB - wA, textDidChange ? 0 : (hB - hA) / 2)
                break
            }
            default: {
                if (textDidChange) break
                delta = new Vec(0, (hB - hA) / 2)
                break
            }
        }

        if (delta) {
            // account for shape rotation when writing text:
            delta.rot(next.rotation)
            const { x, y } = next
            return {
                ...next,
                x: x - delta.x,
                y: y - delta.y,
                props: { ...next.props, w: wB },
            }
        } else {
            return {
                ...next,
                props: { ...next.props, w: wB },
            }
        }
    }

    component(shape: LatexShape) {
        const {
            id,
            props: { font, size, text, color, scale, textAlign },
        } = shape

        const { width, height } = this.getMinDimensions(shape)
        const isSelected = id === this.editor.getOnlySelectedShapeId()
        const isEditing = id === this.editor.getEditingShapeId()
        const theme = useDefaultColorTheme()
        const handleKeyDown = useTextShapeKeydownHandler(id)

        if (isEditing) {
            return (
                <TextLabel
                    shapeId={id}
                    classNamePrefix="latex-shape"
                    type="text"
                    font={font}
                    fontSize={FONT_SIZES[size]}
                    lineHeight={TEXT_PROPS.lineHeight}
                    align={textAlign}
                    verticalAlign="middle"
                    text={text}
                    labelColor={theme[color].solid}
                    isSelected={isSelected}
                    textWidth={width}
                    textHeight={height}
                    style={{
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                    }}
                    wrap
                    onKeyDown={handleKeyDown}
                >
                </TextLabel>
            )
        } else {
            return (
                <MathJaxContext>
                    <MathJax>
                        <div style={{ fontSize: FONT_SIZES[size] * scale, color: theme[color].solid }}>
                            {"\\(" + text + "\\)"}
                        </div>
                    </MathJax>
                </MathJaxContext>
            )
        }
    }

    indicator(shape: LatexShape) {
        const { id } = shape
        const element_width: any = document.querySelector(`[data-shape-id="${id}"] > span > div > mjx-container`)
        const element_height: any = document.querySelector(`[data-shape-id="${id}"] > span`)

        if (element_height === null || element_width === null) return null

        const width = element_width.getBoundingClientRect().width
        const height = element_height.getBoundingClientRect().height

        const editor = useEditor()
        if (shape.props.autoSize && editor.getEditingShapeId() === shape.id) return null
        return <rect width={width} height={height} />
    }
}

function getTextSize(editor: Editor, props: LatexShape["props"]) {

    const { font, text, autoSize, size, w } = props

    const minWidth = autoSize ? 16 : Math.max(16, w)
    const fontSize = FONT_SIZES[size]

    const cw = autoSize
        ? null
        : // `measureText` floors the number so we need to do the same here to avoid issues.
            Math.floor(Math.max(minWidth, w))

    const result = editor.textMeasure.measureText(text, {
        ...TEXT_PROPS,
        fontFamily: FONT_FAMILIES[font],
        fontSize: fontSize,
        maxWidth: cw,
    })

    // If we're autosizing the measureText will essentially `Math.floor`
    // the numbers so `19` rather than `19.3`, this means we must +1 to
    // whatever we get to avoid wrapping.
    if (autoSize) {
        result.w += 1
    }

    return {
        width: Math.max(minWidth, result.w),
        height: Math.max(fontSize, result.h),
    }
}

function resizeScaled(
    shape: TLBaseShape<any, { scale: number }>,
    { initialBounds, scaleX, scaleY, newPoint, handle }: TLResizeInfo<any>
) {
    let scaleDelta: number
    switch (handle) {
        case 'bottom_left':
        case 'bottom_right':
        case 'top_left':
        case 'top_right': {
            scaleDelta = Math.max(0.01, Math.max(Math.abs(scaleX), Math.abs(scaleY)))
            break
        }
        case 'left':
        case 'right': {
            scaleDelta = Math.max(0.01, Math.abs(scaleX))
            break
        }
        case 'bottom':
        case 'top': {
            scaleDelta = Math.max(0.01, Math.abs(scaleY))
            break
        }
        default: {
            throw exhaustiveSwitchError(handle)
        }
    }

    // Compute the offset (if flipped X or flipped Y)
    const offset = new Vec(0, 0)

    if (scaleX < 0) {
        offset.x = -(initialBounds.width * scaleDelta)
    }
    if (scaleY < 0) {
        offset.y = -(initialBounds.height * scaleDelta)
    }

    // Apply the offset to the new point
    const { x, y } = Vec.Add(newPoint, offset.rot(shape.rotation))

    return {
        x,
        y,
        props: {
            scale: scaleDelta * shape.props.scale,
        },
    }
}

function useTextShapeKeydownHandler(id: TLShapeId) {
    const editor = useEditor()

    return useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (editor.getEditingShapeId() !== id) return

            switch (e.key) {
                case 'Enter': {
                    if (e.ctrlKey || e.metaKey) {
                        editor.complete()
                    }
                    break
                }
                // case 'Tab': {
                //     preventDefault(e)
                //     if (e.shiftKey) {
                //         TextHelpers.unindent(e.currentTarget)
                //     } else {
                //         TextHelpers.indent(e.currentTarget)
                //     }
                //     break
                // }
            }
        },
        [editor, id]
    )
}

function exhaustiveSwitchError(value: never, property?: string): never {
	const debugValue =
		property && value && typeof value === 'object' && property in value ? value[property] : value
	throw new Error(`Unknown switch case ${debugValue}`)
}

type InputType = {
    status: boolean; // false: 未成功輸入、true: 成功輸入
    result: string;
};

type InputDialogProps = {
    onClose: (input: InputType) => void;
};

const InputDialog: React.FC<InputDialogProps> = ({ onClose }) => {
    const [contentareaValue, setContentareaValue] = useState("");

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                handleCancelClick();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const handleOkClick = () => {
        const userInput: string = contentareaValue

        onClose({
            status: true,
            result: userInput,
        });
    };

    const handleCancelClick = () => {
        onClose({
            status: false,
            result: "",
        });
    };

    // 若 Dialog 本體被按到的話，就會使用 stopPropagation 防止冒泡
    const handleDialogClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div style={{ position: "fixed", width: "100%", height: "100%" }} onClick={handleCancelClick}>
            <div
                style={{
                    position: "fixed",
                    width: "30%",
                    left: "50%", top: "50%", transform: "translate(-50%, -50%)",
                    borderRadius: "9px",
                    padding: "12px",
                    backgroundColor: "white",
                    boxShadow: "0 0 10px rgba(0,0,0,0.1)",
                    zIndex: 9999,
                    display: "flex",
                    flexDirection: "column"
                }}
                onClick={handleDialogClick}
            >
                <p>Content:</p>
                <textarea
                    rows={5}
                    value={contentareaValue}
                    placeholder={"\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}"}
                    style={{ padding: "10px", width: "100%", boxSizing: "border-box", resize: "vertical", borderRadius: "6px" }}
                    onChange={(e) => setContentareaValue(e.target.value)}
                />
                <br />

                <p>Preview:</p>
                <MathJaxContext>
                    <MathJax>
                        <div style={{ fontSize: 24 }}>
                            {"\\(" + contentareaValue + "\\)"}
                        </div>
                    </MathJax>
                </MathJaxContext>
                <br />

                <div style={{ display: "flex", gap: "10px" }}>
                    <button style={{ flex: "1", height: "2em", backgroundColor: "#CCCCCC", color: "#000000", border: "0px", borderRadius: "6px" }} onClick={handleCancelClick}>Cancel</button>
                    <button style={{ flex: "1", height: "2em", backgroundColor: "#3182ED", color: "#FFFFFF", border: "0px", borderRadius: "6px" }} onClick={handleOkClick}>OK</button>
                </div>
            </div>
        </div>
    );
};

let createInputDialog = async (): Promise<InputType> => {
    return new Promise<InputType>((resolve) => {
        const container = document.createElement("div");
        document.body.appendChild(container);

        const handleClose = (input: InputType) => {
            ReactDOM.unmountComponentAtNode(container);
            document.body.removeChild(container);
            resolve(input);
        };

        ReactDOM.render(<InputDialog onClose={handleClose} />, container);
    });
}

export class DrawLatex extends StateNode {
    static override id = "latex"
    static override isLockable = true
    override shapeType = "text"
    override onEnter = () => {
        this.editor.setCursor({ type: "cross", rotation: 0 })
    }

    override onPointerDown = () => {

        createInputDialog().then(userInput => {
            if (userInput.status) {
                const { currentPagePoint } = this.editor.inputs;
                
                this.editor.createShape({ type: "latex-text", x: currentPagePoint.x, y: currentPagePoint.y, props: { text: userInput.result } });
            }
        });
    }
}