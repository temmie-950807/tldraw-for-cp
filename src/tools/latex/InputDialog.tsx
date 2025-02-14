import { MathJaxContext, MathJax } from "better-react-mathjax";
import { useState, useEffect } from "react";
import ReactDOM from "react-dom";

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

export let createInputDialog = async (): Promise<InputType> => {
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