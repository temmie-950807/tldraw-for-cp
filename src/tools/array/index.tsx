import { StateNode, createShapeId } from "tldraw";
import { createInputDialog } from "./InputDialog";

const GAP = 150;

export class DrawArray extends StateNode {
    static override id = "array";
    static override isLockable = true;
    override shapeType = "draw";

    override onEnter = () => {
        this.editor.setCursor({ type: "cross", rotation: 0 });
    };

    override onPointerDown = () => {
        this.editor.setCursor({ type: "pointer", rotation: 0 });
        createInputDialog().then((userInput) => {
            const { currentPagePoint } = this.editor.inputs;

            for (let i = 0; i < userInput.content?.length; i++) {
                const rectangle_id = createShapeId();
                this.editor.createShape({
                    id: rectangle_id,
                    type: "geo",
                    x: currentPagePoint.x + GAP * i,
                    y: currentPagePoint.y,
                    props: {
                        geo: "rectangle",
                        w: 100,
                        h: 100,
                        text: userInput.content[i],
                        dash: "solid",
                    },
                });
                const rectangle = this.editor.getShape(rectangle_id) as any;
                this.editor.createShape({
                    type: "text",
                    x: rectangle.x,
                    y: rectangle.y - 40,
                    props: {
                        text: (i + userInput.based).toString(),
                        color: "grey",
                    },
                });
            }
        });
    };
} 