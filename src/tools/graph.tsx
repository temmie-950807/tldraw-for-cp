import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { createShapeId, StateNode } from "tldraw"

const OFFSET = 12
const GAP = 200

type InputType = {
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

export class DrawGraph extends StateNode {
    static override id = "graph"
    static override isLockable = true
    override shapeType = "draw"
    
    override onEnter = () => {
        this.editor.setCursor({ type: "cross", rotation: 0 })
    }

    override onPointerDown = () => {

        createInputDialog().then(userInput => {
            if (userInput.status==true) {
                // 拆解每一行的輸入
                let graph_structure: String[][] = userInput.result

                // 把 node 跟 edge 提取出來（node 去重）
                let node: String[] = [];
                let edge: String[][] = [];
                for (let i = 0; i < graph_structure.length; i++) {
                    if (graph_structure[i].length == 1) {
                        node.push(graph_structure[i][0]);
                    } else if (graph_structure[i].length == 2 || graph_structure[i].length == 3) {
                        node.push(graph_structure[i][0]);
                        node.push(graph_structure[i][1]);
                        edge.push(graph_structure[i]);
                    }
                }
                node = [...new Set(node)];

                // 建立 node
                let node_id = new Map;
                if (node.length > 0) {
                    const { currentPagePoint } = this.editor.inputs
                    for (let i = 0; i < node.length; i++) {
                        let shape_id = createShapeId();
                        node_id.set(node[i], shape_id);

                        this.editor.createShape({
                            id: shape_id,
                            type: "geo",
                            x: currentPagePoint.x - OFFSET + GAP * i,
                            y: currentPagePoint.y - OFFSET,
                            props: {
                                text: node[i],
                                fill: "semi",
                                dash: "solid",
                                font: "mono",
                            },
                        })
                    }
                }

                // 建立 edge
                if (edge.length > 0) {
                    for (let i = 0; i < edge.length; i++) {
                        let arrow_id = createShapeId();

                        if (edge[i].length == 2) {
                            this.editor.createShape({
                                id: arrow_id,
                                type: "arrow",
                                props: {
                                    fill: "semi",
                                    dash: "solid",
                                    font: "mono",
                                },
                            });
                        } else {
                            this.editor.createShape({
                                id: arrow_id,
                                type: "arrow",
                                props: {
                                    text: edge[i][2],
                                    fill: "semi",
                                    dash: "solid",
                                    font: "mono",
                                },
                            });
                        }

                        this.editor.createBindings([
                            {
                                type: "arrow",
                                fromId: arrow_id,
                                toId: node_id.get(edge[i][0]),
                                props: {
                                    terminal: "start",
                                    isExact: false,
                                    normalizedAnchor: { x: 0.5, y: 0.5 },
                                    isPrecise: false
                                }
                            },
                            {
                                type: "arrow",
                                fromId: arrow_id,
                                toId: node_id.get(edge[i][1]),
                                props: {
                                    terminal: "end",
                                    isExact: false,
                                    normalizedAnchor: { x: 0.5, y: 0.5 },
                                    isPrecise: false
                                }
                            },
                        ]);
                    }
                }
            }
        });
    }
}