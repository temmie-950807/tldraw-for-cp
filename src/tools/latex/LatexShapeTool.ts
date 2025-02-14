import { StateNode, TLStateNodeConstructor } from "tldraw"
import { createInputDialog } from "./InputDialog"
import { Idle } from "./toolStates/Idle"
import { Pointing } from "./toolStates/Pointing"

export class DrawLatex extends StateNode {
    static override id = "latex"
    static override initial = "idle"
    static override children(): TLStateNodeConstructor[] {
        return [Idle, Pointing]
    }
    override shapeType = "text"

    override onEnter = () => {
        this.editor.setCursor({ type: "cross", rotation: 0 })
    }

    override onPointerDown = () => {
        createInputDialog().then(userInput => {
            if (userInput.status) {
                const { currentPagePoint } = this.editor.inputs;
                
                this.editor.createShape({ type: "latex-text", x: currentPagePoint.x, y: currentPagePoint.y, props: { text: userInput.result } });
            }
        });
    }
}