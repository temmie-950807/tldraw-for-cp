import { StateNode, createShapeId } from "tldraw";
import { createInputDialog } from "./InputDialog";
import { SQUARE_SIZE, COLOR_MAP, FILL_MAP } from "./constants";

export class DrawGrid extends StateNode {
    static override id = "grid";
    static override isLockable = true;
    override shapeType = "draw";

    override onEnter = () => {
        this.editor.setCursor({ type: "cross", rotation: 0 });
    };

    override onPointerDown = () => {
        this.editor.setCursor({ type: "pointer", rotation: 0 });
        createInputDialog().then((userInput) => {
            if (!userInput.isValidInput) return;

            const { currentPagePoint } = this.editor.inputs;
            const { height, width, content, based, isColor } = userInput;

            for (let i = 0; i < height; i++) {
                for (let j = 0; j < width; j++) {
                    const rectangle_id = createShapeId();
                    this.editor.createShape({
                        id: rectangle_id,
                        type: "geo",
                        x: currentPagePoint.x + SQUARE_SIZE * j,
                        y: currentPagePoint.y + SQUARE_SIZE * i,
                        props: {
                            geo: "rectangle",
                            w: SQUARE_SIZE,
                            h: SQUARE_SIZE,
                            text: content[i][j],
                            dash: "solid",
                            color: isColor ? COLOR_MAP[content[i][j]] : "black",
                            fill: isColor ? FILL_MAP[content[i][j]] : "solid",
                        },
                    });
                }
            }

            // 添加行號
            for (let i = 0; i < height; i++) {
                this.editor.createShape({
                    type: "text",
                    x: currentPagePoint.x - 40,
                    y: currentPagePoint.y + SQUARE_SIZE * i,
                    props: {
                        text: (i + based).toString(),
                        color: "grey",
                    },
                });
            }

            // 添加列號
            for (let j = 0; j < width; j++) {
                this.editor.createShape({
                    type: "text",
                    x: currentPagePoint.x + SQUARE_SIZE * j,
                    y: currentPagePoint.y - 40,
                    props: {
                        text: (j + based).toString(),
                        color: "grey",
                    },
                });
            }
        });
    };
} 