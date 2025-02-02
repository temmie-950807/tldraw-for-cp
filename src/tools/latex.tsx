import {
    DefaultColorStyle,
    DefaultSizeStyle,
    FONT_SIZES,
    Geometry2d,
    RecordProps,
    Rectangle2d,
    ShapeUtil,
    StateNode,
    T,
    TLBaseShape,
    TLDefaultColorStyle,
    TLDefaultSizeStyle,
    TLResizeInfo,
    resizeBox,
    useDefaultColorTheme,
} from "tldraw"
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "../index.css";

type ILatexShape = TLBaseShape<
    "latex-text",
    {
        w: number,
        h: number,
        size: TLDefaultSizeStyle
        color: TLDefaultColorStyle
        content: string
    }
>

export class LatexUtil extends ShapeUtil<ILatexShape> {
    static override type = "latex-text" as const
    static override props: RecordProps<ILatexShape> = {
        w: T.number,
        h: T.number,
        size: DefaultSizeStyle,
        color: DefaultColorStyle,
        content: T.string,
    }

    getDefaultProps(): ILatexShape["props"] {
        return {
            w: 200,
            h: 50,
            size: "m",
            color: "black",
            content: "",
        }
    }

    override canEdit = () => false
    override canResize = () => true
    override isAspectRatioLocked = () => false

    getGeometry(shape: ILatexShape): Geometry2d {
        return new Rectangle2d({
            width: shape.props.w,
            height: shape.props.h,
            isFilled: true,
        })
    }

    override onResize(shape: any, info: TLResizeInfo<any>) {
		return resizeBox(shape, info)
	}

    component(shape: ILatexShape) {
        const theme = useDefaultColorTheme()
        
        return (
            <MathJaxContext>
                <MathJax>
                    <div style={{ fontSize: FONT_SIZES[shape.props.size], color: theme[shape.props.color].solid }}>
                        {"\\(" + shape.props.content + "\\)"}
                    </div>
                </MathJax>
            </MathJaxContext>
        )
    }

    indicator(shape: ILatexShape) {
        return <rect width={shape.props.w} height={shape.props.h} />
    }
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

async function createInputDialog(): Promise<InputType> {
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
                
                this.editor.createShape({ type: "latex-text", x: currentPagePoint.x, y: currentPagePoint.y, props: { content: userInput.result } });
            }
        });
    }
}