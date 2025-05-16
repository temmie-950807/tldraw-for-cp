import { Editor, StateNode, TLArrowBinding, TLArrowShape, TLShapeId, Vec, createShapeId, toRichText } from "tldraw";
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
                let graph_structure: string[][] = userInput.result

                // 把 node 跟 edge 提取出來（node 去重）
                let node: string[] = [];
                let edge: string[][] = [];
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
								richText: toRichText(node[i]),
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
                        if (edge[i].length == 2) {
                            createTextArrowBetweenShapes(this.editor, node_id.get(edge[i][0]), node_id.get(edge[i][1]), "");
                        } else {
                            createTextArrowBetweenShapes(this.editor, node_id.get(edge[i][0]), node_id.get(edge[i][1]), edge[i][2]);
                        }
                    }
                }
            }
        });
    }
} 

// modify from https://github.com/tldraw/tldraw/blob/main/apps/examples/src/examples/create-arrow/CreateArrowExample.tsx
function createTextArrowBetweenShapes(
	editor: Editor,
	startShapeId: TLShapeId,
	endShapeId: TLShapeId,
	text: string,
	options = {} as {
		parentId?: TLShapeId
		start?: Partial<Omit<TLArrowBinding['props'], 'terminal'>>
		end?: Partial<Omit<TLArrowBinding['props'], 'terminal'>>
	}
) {
	const { start = {}, end = {}, parentId } = options

	const {
		normalizedAnchor: startNormalizedAnchor = { x: 0.5, y: 0.5 },
		isExact: startIsExact = false,
		isPrecise: startIsPrecise = false,
	} = start
	const {
		normalizedAnchor: endNormalizedAnchor = { x: 0.5, y: 0.5 },
		isExact: endIsExact = false,
		isPrecise: endIsPrecise = false,
	} = end

	const startTerminalNormalizedPosition = Vec.From(startNormalizedAnchor)
	const endTerminalNormalizedPosition = Vec.From(endNormalizedAnchor)

	const parent = parentId ? editor.getShape(parentId) : undefined
	if (parentId && !parent) throw Error(`Parent shape with id ${parentId} not found`)

	const startShapePageBounds = editor.getShapePageBounds(startShapeId)
	const endShapePageBounds = editor.getShapePageBounds(endShapeId)

	const startShapePageRotation = editor.getShapePageTransform(startShapeId).rotation()
	const endShapePageRotation = editor.getShapePageTransform(endShapeId).rotation()

	if (!startShapePageBounds || !endShapePageBounds) return

	const startTerminalPagePosition = Vec.Add(
		startShapePageBounds.point,
		Vec.MulV(
			startShapePageBounds.size,
			Vec.Rot(startTerminalNormalizedPosition, startShapePageRotation)
		)
	)
	const endTerminalPagePosition = Vec.Add(
		endShapePageBounds.point,
		Vec.MulV(
			startShapePageBounds.size,
			Vec.Rot(endTerminalNormalizedPosition, endShapePageRotation)
		)
	)

	const arrowPointInParentSpace = Vec.Min(startTerminalPagePosition, endTerminalPagePosition)
	if (parent) {
		arrowPointInParentSpace.setTo(
			editor.getShapePageTransform(parent.id)!.applyToPoint(arrowPointInParentSpace)
		)
	}

	const arrowId = createShapeId()
	editor.run(() => {
		editor.markHistoryStoppingPoint('creating_arrow')
		editor.createShape<TLArrowShape>({
			id: arrowId,
			type: 'arrow',
			x: arrowPointInParentSpace.x,
			y: arrowPointInParentSpace.y,
			props: {
				text: text,
				start: {
					x: arrowPointInParentSpace.x - startTerminalPagePosition.x,
					y: arrowPointInParentSpace.x - startTerminalPagePosition.x,
				},
				end: {
					x: arrowPointInParentSpace.x - endTerminalPagePosition.x,
					y: arrowPointInParentSpace.x - endTerminalPagePosition.x,
				},
			},
		})

		editor.createBindings<TLArrowBinding>([
			{
				fromId: arrowId,
				toId: startShapeId,
				type: 'arrow',
				props: {
					terminal: 'start',
					normalizedAnchor: startNormalizedAnchor,
					isExact: startIsExact,
					isPrecise: startIsPrecise,
				},
			},
			{
				fromId: arrowId,
				toId: endShapeId,
				type: 'arrow',
				props: {
					terminal: 'end',
					normalizedAnchor: endNormalizedAnchor,
					isExact: endIsExact,
					isPrecise: endIsPrecise,
				},
			},
		])
	})
}