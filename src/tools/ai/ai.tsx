import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { StateNode } from "tldraw";
import "../../index.css"

const myPrompt = `
使用者會會提出繪畫需求，請你根據需求將結果以下格式回傳給使用者，需要的格式範例如下。

[
    {
        id: "shape:",
        type: "geo",
        x: 0,
        y: 0,
        props: {
            geo: "rectangle",
            w: 100,
            h: 100,
            dash: "solid",
            text: "",
            color: "black",
            size: "m",
        },
    },
]

你可以修改以下資訊：
- id 為 "shape:" + 一個隨機且長度為 10 且由英文與數字組成的字串
- w, h 為使用指定的寬與高，預設為 100
- x, y 為使用者指定的 x 與 y 座標，如果有多個正方形，則從左到右列成一排，則右邊的為右邊的 x 座標 + 寬度 + 30，預設為 0
- text 為使用者指定的文字，在使用者為指定時，不要填入任何數字
- color 為使用者指定的顏色，若沒有指定則是黑色，只能是 'black'、'blue'、'green'、'grey'、'light-blue'、'light-green'、'light-red'、'light-violet'、'orange'、'red'、'violet'、'white'、'yellow' 的其中一個，不能指定呈其他顏色或色號。
- geo 為使用者指定的形狀，若沒有指定則為正方形，只能是 'arrow-down'、'arrow-left'、'arrow-right'、'arrow-up'、'check-box'、'cloud'、'diamond'、'ellipse'、'heart'、'hexagon'、'octagon'、'oval'、'pentagon'、'rectangle'、'rhombus-2'、'rhombus'、'star'、'trapezoid'、'triangle'、'x-box'
    - "rectangle" 可以當作正方形或長方形。若使用者指定正方形，則 w 與 h 相等。若使用者指定長方形，若使用者沒有指定大小則設做 w=200, h=100。

其餘沒有提到的屬性不要修改。

輸出要是純文字，不要有其他說明，只要輸出結果。
`;

type InputData = {
    content: string;
};

type InputDialogProps = {
    onClose: (input: InputData) => void;
};

const InputDialog: React.FC<InputDialogProps> = ({ onClose }) => {
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
        const userInput: string = textareaValue.trim();
        onClose({
            content: userInput,
        })
    };

    const handleCancelClick = () => {
        onClose({
            content: "",
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
                <p>question:</p>
                <textarea
                    rows={5}
                    value={textareaValue}
                    placeholder={"Prompt"}
                    style={{ padding: "10px", width: "100%", boxSizing: "border-box", resize: "vertical", borderRadius: "6px"}}
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

let createInputDialog = async (): Promise<InputData> => {
    return new Promise<InputData>((resolve) => {
        const container = document.createElement("div");
        document.body.appendChild(container);

        const handleClose = (input: InputData) => {
            ReactDOM.unmountComponentAtNode(container);
            document.body.removeChild(container);
            resolve(input);
        };

        ReactDOM.render(<InputDialog onClose={handleClose} />, container);
    });
}

export class DrawAi extends StateNode {
    static override id = "ai";
    static override isLockable = true;
    override shapeType = "draw";

    override onEnter = () => {
        this.editor.setCursor({ type: "cross", rotation: 0 });
    };

    override onPointerDown = () => {
        this.editor.setCursor({ type: "pointer", rotation: 0 });
        createInputDialog().then((userInput: InputData) => {

            const { currentPagePoint } = this.editor.inputs;
            const dx = currentPagePoint.x;
            const dy = currentPagePoint.y;

            const apiKey = ""
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
            const requestBody = {
                contents: [{
                    // parts: [{ text: myPrompt + "\n" + "請幫我生成一個長跟寬都是 100 的正方形" }]
                    parts: [{ text: myPrompt + "\n" + userInput.content }]
                }]
            };

            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            })
            .then(response => response.json())
            .then(data => {
                const result = data.candidates[0].content.parts[0].text;
                
                try {
                    let shapesArray = eval('(' + result + ')');
                    for (let i=0 ; i<shapesArray.length ; i++) {
                        shapesArray[i].x += dx;
                        shapesArray[i].y += dy;
                    }
                    this.editor.createShapes(shapesArray)
                } catch (e) {
                    console.error('Result is not a valid result:', e);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });

        });
    };
}