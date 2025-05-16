import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

export type InputData = {
    isValidInput: boolean;
    based: number;
    height: number;
    width: number;
    isColor: boolean;
    splitBySpace: boolean;
    content: string[][];
};

type InputDialogProps = {
    onClose: (input: InputData) => void;
};

const InputDialog: React.FC<InputDialogProps> = ({ onClose }) => {
    const [based, setBased] = useState(0);
    const [textareaValue, setTextareaValue] = useState("");
    const [autoColor, setAutoColor] = useState(false);
    const [splitBySpace, setSplitBySpace] = useState(false);
    const [isValidInput, setIsValidInput] = useState(true);

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

    useEffect(() => {
        const userInput: string[][] = textareaValue
            .split("\n")
            .map(str => str.trim().split(" "))
            .filter(str => str.length && str[0].length);

        if (textareaValue.length==0) {
            setIsValidInput(false);
        }else{
            if (userInput[0].length == 2) {
                const H = Number(userInput[0][0]);
                const W = Number(userInput[0][1]);
                
                if (userInput.length==1){
                    setIsValidInput(true);
                }else if (userInput.length-1!=H){
                    setIsValidInput(false);
                }else if (splitBySpace==false && userInput.slice(1).every(row => row[0].length==W)){
                    setIsValidInput(true);
                }else if (splitBySpace==true && userInput.slice(1).every(row => row.length==W)){
                    setIsValidInput(true);
                }else{
                    setIsValidInput(false);
                }
            } else {
                setIsValidInput(false);
            }
        }

    }, [textareaValue, splitBySpace]);

    const handleOkClick = () => {
        const userInput: string[][] = textareaValue
            .split("\n")
            .map(str => str.trim().split(" "))
            .filter(str => str.length && str[0].length);

        if (userInput[0].length == 2) {
            const H = Number(userInput[0][0]);
            const W = Number(userInput[0][1]);
            let result: string[][] = Array.from({ length: H }, () => Array(W).fill(""));

            if (userInput.length-1==H) {
                if (splitBySpace==false && userInput.slice(1).every(row => row[0].length==W)){
                    for (let i=1 ; i<=H ; i++) {
                        for (let j=0 ; j<W ; j++) {
                            result[i-1][j] = userInput[i][0][j];
                        }
                    }
                }else if (splitBySpace==true && userInput.slice(1).every(row => row.length==W)){
                    for (let i=1 ; i<=H ; i++) {
                        const temp: string[] = userInput[i];
                        for (let j=0 ; j<W ; j++) {
                            result[i-1][j] = temp[j];
                        }
                    }
                }
            }

            onClose({
                isValidInput: true,
                based: based,
                height: H,
                width: W,
                isColor: autoColor,
                splitBySpace: splitBySpace,
                content: result,
            });
        } else {
            onClose({
                isValidInput: false,
                based: 0,
                height: 0,
                width: 0,
                isColor: false,
                splitBySpace: false,
                content: [],
            });
        }
    };

    const handleCancelClick = () => {
        onClose({
            isValidInput: false,
            based: 0,
            height: 0,
            width: 0,
            isColor: false,
            splitBySpace: false,
            content: [],
        });
    };

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
                    <input 
                        type="range" 
                        min="-2" 
                        max="2" 
                        defaultValue="0" 
                        step="1" 
                        className="slider" 
                        style={{ width: "100%" }}
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
                <br />

                <label>
                    Auto color:
                    <input
                        type="checkbox"
                        checked={autoColor}
                        onChange={(e) => setAutoColor(e.target.checked)}
                    />
                </label>
                <br />

                <label>
                    Split by space:
                    <input
                        type="checkbox"
                        checked={splitBySpace}
                        onChange={(e) => setSplitBySpace(e.target.checked)}
                    />
                </label>
                <br />

                <p>Grid content:</p>
                <textarea
                    value={textareaValue}
                    placeholder={"2 3\n###\n###"}
                    style={{ 
                        padding: "10px",
                        height: "150px",
                        resize: "none"
                    }}
                    onChange={(e) => setTextareaValue(e.target.value)}
                />
                <br />
                <div style={{ display: "flex", gap: "10px" }}>
                    <button 
                        style={{ 
                            flex: "1", 
                            height: "2em", 
                            backgroundColor: "#CCCCCC", 
                            color: "#000000", 
                            border: "0px", 
                            borderRadius: "6px" 
                        }} 
                        onClick={handleCancelClick}
                    >
                        Cancel
                    </button>
                    <button 
                        style={{ 
                            flex: "1", 
                            height: "2em", 
                            backgroundColor: "#3182ED", 
                            color: "#FFFFFF", 
                            border: "0px", 
                            borderRadius: "6px" 
                        }} 
                        onClick={handleOkClick}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export const createInputDialog = async (): Promise<InputData> => {
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
}; 