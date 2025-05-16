import { useState, useEffect } from "react";
import ReactDOM from "react-dom";

export type InputType = {
    status: boolean; // false: 未成功輸入、true: 成功輸入
    result: string[][];
};

type InputDialogProps = {
    onClose: (input: InputType) => void;
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
        const userInput: string[][] = textareaValue
            .split("\n")
            .map(str => str.trim().split(" "))
            .filter(str => str.length);

        if (userInput.length === 0) {
            onClose({
                status: false,
                result: [],
            });
        } else {
            onClose({
                status: true,
                result: userInput,
            });
        }
    };

    const handleCancelClick = () => {
        onClose({
            status: false,
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
                <p>graph structure:</p>
                <textarea
                    rows={10}
                    cols={20}
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

export const createInputDialog = async (): Promise<InputType> => {
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