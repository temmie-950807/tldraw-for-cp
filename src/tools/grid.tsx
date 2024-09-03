import { StateNode } from "tldraw"

const SIZE = 100

// 輸入框的範本
import { useState, useEffect } from "react";
import ReactDOM from "react-dom";

type InputType = {
    status: boolean; // false: 未成功輸入、true: 成功輸入
    based: number;
    result: number[];
};

type InputDialogProps = {
    onClose: (input: InputType) => void;
};

const InputDialog: React.FC<InputDialogProps> = ({ onClose }) => {
    const [based, setBased] = useState(0);
    const [textareaValue, setTextareaValue] = useState("");

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
        const userInput: string[][] = textareaValue
            .split("\n")
            .map(str => str.trim().split(" "))
            .filter(str => str.length);
        console.log(userInput)

        if (userInput[0].length == 2) {
            onClose({
                status: true,
                based: based,
                result: userInput[0].map(str => Number(str)),
            });
        } else {
            onClose({
                status: false,
                based: 0,
                result: [],
            });
        }
    };

    const handleCancelClick = () => {
        onClose({
            status: false,
            based: 0,
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
                <p>index shift:</p>
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

                <p>row and column:</p>
                <input
                    width="50%"
                    value={textareaValue}
                    style={{ padding: "10px" }}
                    onChange={(e) => setTextareaValue(e.target.value)}
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
                const h: number = userInput.result[0]
                const w: number = userInput.result[1]
                const based: number = userInput.based
                console.log(h, w, based)

                // 建立表格
                const { currentPagePoint } = this.editor.inputs
                
                for (let j=0 ; j<w ; j++){
                    this.editor.createShape({
                        type: "text",
                        x: currentPagePoint.x + SIZE * j,
                        y: currentPagePoint.y - 40,
                        props: {
                            font: "mono",
                            text: (j + based).toString(),
                            color: "grey",
                        },
                    })
                }
                for (let i=0 ; i<h ; i++){
                    this.editor.createShape({
                        type: "text",
                        x: currentPagePoint.x - 40,
                        y: currentPagePoint.y + SIZE * i,
                        props: {
                            font: "mono",
                            text: (i + based).toString(),
                            color: "grey",
                        },
                    })
                    for (let j=0 ; j<w ; j++){
                        this.editor.createShape({
                            type: "geo",
                            x: currentPagePoint.x + SIZE * j,
                            y: currentPagePoint.y + SIZE * i,
                            props: {
                                fill: "semi",
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