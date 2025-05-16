import { Editor, StateNode, TLKeyboardEventInfo, TLPointerEventInfo, TLShape, throttle } from "tldraw";

export class Idle extends StateNode {
    static override id = "idle";

    override onPointerMove(info: TLPointerEventInfo) {
        switch (info.target) {
            case "shape":
            case "canvas": {
                updateHoveredShapeId(this.editor)
            }
        }
    }

    override onPointerDown = (info: TLPointerEventInfo) => {
        this.parent.transition("pointing", info);
    };

    override onEnter = () => {
        this.editor.setCursor({ type: "cross", rotation: 0 });
    };

    override onExit = () => {
        // 不需要在這裡調用 cancel，因為 throttle 函數會自動處理
    }

    override onKeyDown(info: TLKeyboardEventInfo) {
        if (info.key === 'Enter') {
            if (this.editor.getIsReadonly()) return null
            const onlySelectedShape = this.editor.getOnlySelectedShape()
            // If the only selected shape is editable, start editing it
            if (
                onlySelectedShape &&
                this.editor.getShapeUtil(onlySelectedShape).canEdit(onlySelectedShape)
            ) {
                this.editor.setCurrentTool('select')
                this.editor.setEditingShape(onlySelectedShape.id)
                this.editor.root.getCurrent()?.transition('editing_shape', {
                    ...info,
                    target: 'shape',
                    shape: onlySelectedShape,
                })
            }
        }
    }

    override onCancel() {
        this.editor.setCurrentTool('select')
    }
}

function _updateHoveredShapeId(editor: Editor) {
    const hitShape = editor.getShapeAtPoint(editor.inputs.currentPagePoint, {
        hitInside: false,
        hitLabels: false,
        margin: editor.options.hitTestMargin / editor.getZoomLevel(),
        renderingOnly: true,
    })

    if (!hitShape) return editor.setHoveredShape(null)

    let shapeToHover: TLShape | undefined = undefined

    const outermostShape = editor.getOutermostSelectableShape(hitShape)

    if (outermostShape === hitShape) {
        shapeToHover = hitShape
    } else {
        if (
            outermostShape.id === editor.getFocusedGroupId() ||
            editor.getSelectedShapeIds().includes(outermostShape.id)
        ) {
            shapeToHover = hitShape
        } else {
            shapeToHover = outermostShape
        }
    }

    return editor.setHoveredShape(shapeToHover.id)
}

/** @internal */
export const updateHoveredShapeId = throttle(
    _updateHoveredShapeId,
    process.env.NODE_ENV === 'test' ? 0 : 32
)