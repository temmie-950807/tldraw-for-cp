import { StateNode, createShapeId } from "tldraw";
import { createInputDialog } from "./InputDialog";
import { OFFSET, GAP } from "./constants";

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