import { useState, useEffect } from "react";
import ReactDOM from "react-dom";

export type InputType = {
    status: boolean; // false: 未成功輸入、true: 成功輸入
    result: string[][];
};

type GraphType = "任意圖" | "K_n" | "K_{n,m}" | "C_n" | "P_n";

type InputDialogProps = {
    onClose: (input: InputType) => void;
};

const InputDialog: React.FC<InputDialogProps> = ({ onClose }) => {
    const [textareaValue, setTextareaValue] = useState("");
    const [graphType, setGraphType] = useState<GraphType>("任意圖");
    const [n, setN] = useState<number>(3);
    const [m, setM] = useState<number>(3);

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

    const generateGraph = (type: GraphType, n: number, m: number = 3): string[][] => {
        const result: string[][] = [];
        
        switch (type) {
            case "K_n":
                // 生成完全圖 K_n
                for (let i = 0; i < n; i++) {
                    result.push([`v${i}`]);
                    for (let j = i + 1; j < n; j++) {
                        result.push([`v${i}`, `v${j}`]);
                    }
                }
                break;
            
            case "K_{n,m}":
                // 生成二分圖 K_{n,m}
                for (let i = 0; i < n; i++) {
                    result.push([`v${i}`]);
                }
                for (let i = 0; i < m; i++) {
                    result.push([`u${i}`]);
                }
                for (let i = 0; i < n; i++) {
                    for (let j = 0; j < m; j++) {
                        result.push([`v${i}`, `u${j}`]);
                    }
                }
                break;
            
            case "C_n":
                // 生成環 C_n
                for (let i = 0; i < n; i++) {
                    result.push([`v${i}`]);
                }
                for (let i = 0; i < n; i++) {
                    result.push([`v${i}`, `v${(i + 1) % n}`]);
                }
                break;
            
            case "P_n":
                // 生成鍊 P_n
                for (let i = 0; i < n; i++) {
                    result.push([`v${i}`]);
                }
                for (let i = 0; i < n - 1; i++) {
                    result.push([`v${i}`, `v${i + 1}`]);
                }
                break;
        }
        
        return result;
    };

    const handleOkClick = () => {
        let userInput: string[][];
        
        if (graphType === "任意圖") {
            userInput = textareaValue
                .split("\n")
                .map(str => str.trim().split(" "))
                .filter(str => str.length);
        } else {
            userInput = generateGraph(graphType, n, m);
        }

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
                <div style={{ marginBottom: "10px" }}>
                    <label style={{ display: "block", marginBottom: "5px" }}>圖形類型：</label>
                    <select
                        value={graphType}
                        onChange={(e) => setGraphType(e.target.value as GraphType)}
                        style={{ width: "100%", padding: "5px" }}
                    >
                        <option value="任意圖">任意圖</option>
                        <option value="K_n">K_n（完全圖）</option>
                        <option value="K_{n,m}">K_{n,m}（二分圖）</option>
                        <option value="C_n">C_n（環）</option>
                        <option value="P_n">P_n（鍊）</option>
                    </select>
                </div>

                {graphType === "任意圖" ? (
                    <>
                        <p>graph structure:</p>
                        <textarea
                            rows={10}
                            cols={20}
                            value={textareaValue}
                            style={{ padding: "10px" }}
                            onChange={(e) => setTextareaValue(e.target.value)}
                        />
                    </>
                ) : (
                    <div style={{ marginBottom: "10px" }}>
                        <label style={{ display: "block", marginBottom: "5px" }}>
                            n: <input
                                type="number"
                                min="1"
                                max="20"
                                value={n}
                                onChange={(e) => setN(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                                style={{ width: "60px", padding: "5px" }}
                            />
                        </label>
                        {graphType === "K_{n,m}" && (
                            <label style={{ display: "block", marginBottom: "5px" }}>
                                m: <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={m}
                                    onChange={(e) => setM(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                                    style={{ width: "60px", padding: "5px" }}
                                />
                            </label>
                        )}
                    </div>
                )}

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