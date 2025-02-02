import { StateNode } from "tldraw"

const SIZE = 100

// 輸入框的範本
import { useState, useEffect } from "react";
import ReactDOM from "react-dom";

const COLOR_MAP: { [key: string]: string } = {
    // 牆壁
    '#': "black",
    '@': "black",
    '%': "black",

    // 地板
    '.': "black",
};

const FILL_MAP: { [key: string]: string } = {
    // 牆壁
    '#': "semi",
    '@': "semi",
    '%': "semi",

    // 地板
    '.': "solid",
};

const OPACITY_MAP: { [key: string]: number } = {
    // 牆壁
    '#': 0.1,
    '@': 0.1,
    '%': 0.1,

    // 地板
    '.': 1,
};

type InputType = {
    status: boolean; // false: 未成功輸入、true: 成功輸入
    based: number;
    height: number;
    width: number;
    auto_color: boolean;
    result: string[][];
};

type InputDialogProps = {
    onClose: (input: InputType) => void;
};

const InputDialog: React.FC<InputDialogProps> = ({ onClose }) => {
    const [based, setBased] = useState(0);
    const [contentareaValue, setContentareaValue] = useState("");
    const [autoColor, setAutoColor] = useState(false);

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
        const userInput: string[][] = contentareaValue
            .split("\n")
            .map(str => str.trim().split(" "))
            .filter(str => str.length && str[0].length);

        if (userInput[0].length == 2) {
            const H = Number(userInput[0][0]);
            const W = Number(userInput[0][1]);
            let result: string[][] = Array.from({ length: H }, () => Array(W).fill(""));
            
            if (userInput.length-1==H && userInput.slice(1).every(row => row[0].length==W)) {
                for (let i=1 ; i<=H ; i++) {
                    for (let j=0 ; j<W ; j++) {
                        result[i-1][j] = userInput[i][0][j];
                    }
                }
            }

            onClose({
                status: true,
                based: based,
                height: H,
                width: W,
                auto_color: autoColor,
                result: result,
            });
        } else {
            onClose({
                status: false,
                based: 0,
                height: 0,
                width: 0,
                auto_color: false,
                result: [],
            });
            throw new Error("Invalid input");
        }
    };

    const handleCancelClick = () => {
        onClose({
            status: false,
            based: 0,
            height: 0,
            width: 0,
            auto_color: false,
            result: [],
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
                <p>Index shift:</p>
                <div className="slider-container">
                    <input type="range" min="-2" max="2" defaultValue="0" step="1" className="slider" style={{ width: "100%" }}
                        onChange={(e) => setBased(Number(e.target.value))}
                    />
                    <div className="labels" style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>-2</span>
                        <span>-1</span>
                        <span>0</span>
                        <span>1</span>
                        <span>2</span>
                    </div>
                </div>
                <br/>

                <label>
                    Enable auto color:
                    <input
                        type="checkbox"
                        value={autoColor.toString()}
                        onChange={(e) => setAutoColor(e.target.checked)}
                    />
                </label>

                <p>Grid content:</p>
                <textarea
                    rows={5}
                    value={contentareaValue}
                    placeholder={"3 5"+String.fromCharCode(10)+"(below is optional)"+String.fromCharCode(10)+"#####"+String.fromCharCode(10)+"#...#"+String.fromCharCode(10)+"#####"}
                    style={{ padding: "10px", width: "100%", boxSizing: "border-box", resize: "vertical", borderRadius: "6px"}}
                    onChange={(e) => setContentareaValue(e.target.value)}
                />
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

export class DrawGrid extends StateNode {
    static override id = "grid"
    static override isLockable = true
    override shapeType = "draw"
    
    override onEnter = () => {
        this.editor.setCursor({ type: "cross", rotation: 0 })
    }

    override onPointerDown = () => {

        createInputDialog().then(userInput => {
            if (userInput.status==true) {
                // 拆解每一行的輸入
                const H: number = userInput.height
                const W: number = userInput.width
                const based: number = userInput.based
                const content: string[][] = userInput.result
                const autocolor: boolean = userInput.auto_color
                console.log(H, W, based, content, autocolor)

                // 建立表格
                const { currentPagePoint } = this.editor.inputs
                
                for (let j=0 ; j<W ; j++){
                    this.editor.createShape({
                        type: "text",
                        x: currentPagePoint.x + SIZE * j,
                        y: currentPagePoint.y - 40,
                        opacity: 1,
                        props: {
                            font: "mono",
                            text: (j + based).toString(),
                            color: "grey",
                        },
                    })
                }
                for (let i=0 ; i<H ; i++){
                    this.editor.createShape({
                        type: "text",
                        x: currentPagePoint.x - 40,
                        y: currentPagePoint.y + SIZE * i,
                        opacity: 1,
                        props: {
                            font: "mono",
                            text: (i + based).toString(),
                            color: "grey",
                        },
                    })
                    for (let j=0 ; j<W ; j++){
                        this.editor.createShape({
                            type: "geo",
                            x: currentPagePoint.x + SIZE * j,
                            y: currentPagePoint.y + SIZE * i,
                            opacity: autocolor ? (OPACITY_MAP[content[i][j]] || 1) : 1,
                            
                            props: {
                                text: content[i][j],
                                fill: autocolor ? (FILL_MAP[content[i][j]] || "solid") : "semi",
                                color: autocolor ? (COLOR_MAP[content[i][j]] || "black") : "black",
                                dash: "solid",
                                font: "mono",
                            },
                        })
                    }
                }
            }
        });
    }
}