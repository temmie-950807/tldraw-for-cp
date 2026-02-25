import {
    HTMLContainer,
    IndexKey,
    RecordProps,
    Rectangle2d,
    ShapeUtil,
    T,
    TLBaseShape,
    TLShapeUtilCanBindOpts,
    Vec,
    clamp,
    createBindingId,
    getIndexBetween,
} from "tldraw"

import {
    CONTAINER_PADDING,
    ContainerShape,
    CONTAINER_TYPE,
} from "./ContainerShapeUtil"
import { LayoutBinding } from "./LayoutBindingUtil"

const LAYOUT_TYPE = "layout"
const ELEMENT_TYPE = "element"

export type ElementShape = TLBaseShape<typeof ELEMENT_TYPE, { color: string }>

export class ElementShapeUtil extends ShapeUtil<ElementShape> {
    static override type = ELEMENT_TYPE

    static override props: RecordProps<ElementShape> = {
        color: T.string,
    }

    override getDefaultProps() {
        return {
            color: "#AEC6CF",
        }
    }

    override canBind({
        fromShapeType,
        toShapeType,
        bindingType,
    }: TLShapeUtilCanBindOpts<ElementShape>) {
        return (
            fromShapeType === CONTAINER_TYPE &&
            toShapeType === ELEMENT_TYPE &&
            bindingType === LAYOUT_TYPE
        )
    }

    override canEdit() {
        return false
    }

    override canResize() {
        return false
    }

    override hideRotateHandle() {
        return true
    }

    override isAspectRatioLocked() {
        return true
    }

    override getGeometry() {
        return new Rectangle2d({
            width: 100,
            height: 100,
            isFilled: true,
        })
    }

    override component(shape: ElementShape) {
        return (
            <HTMLContainer
                style={{
                    backgroundColor: shape.props.color,
                    borderRadius: "8px",
                }}
            ></HTMLContainer>
        )
    }

    override indicator() {
        return <rect rx={8} ry={8} width={100} height={100} />
    }

    private getTargetContainer(shape: ElementShape, pageAnchor: Vec) {
        return this.editor.getShapeAtPoint(pageAnchor, {
            hitInside: true,
            filter: (otherShape) =>
                this.editor.canBindShapes({
                    fromShape: otherShape,
                    toShape: shape,
                    binding: LAYOUT_TYPE,
                }),
        }) as ContainerShape | undefined
    }

    getBindingIndexForPosition(
        shape: ElementShape,
        container: ContainerShape,
        pageAnchor: Vec
    ) {
        const allBindings = this.editor
            .getBindingsFromShape<LayoutBinding>(container, LAYOUT_TYPE)
            .sort((a, b) => (a.props.index > b.props.index ? 1 : -1))

        const siblings = allBindings.filter((b) => b.toId !== shape.id)

        const order = clamp(
            Math.round(
                (pageAnchor.x - container.x - CONTAINER_PADDING) /
                (100 + CONTAINER_PADDING)
            ),
            0,
            siblings.length + 1
        )

        const belowSib = allBindings[order - 1]
        const aboveSib = allBindings[order]

        let index: IndexKey

        if (belowSib?.toId === shape.id) {
            index = belowSib.props.index
        } else if (aboveSib?.toId === shape.id) {
            index = aboveSib.props.index
        } else {
            index = getIndexBetween(belowSib?.props.index, aboveSib?.props.index)
        }

        return index
    }

    override onTranslateStart(shape: ElementShape) {
        this.editor.updateBindings(
            this.editor
                .getBindingsToShape<LayoutBinding>(shape, LAYOUT_TYPE)
                .map((binding) => ({
                    ...binding,
                    props: { ...binding.props, placeholder: true },
                }))
        )
    }

    override onTranslate(_: ElementShape, shape: ElementShape) {
        const pageAnchor = this.editor
            .getShapePageTransform(shape)
            .applyToPoint({ x: 50, y: 50 })

        const targetContainer = this.getTargetContainer(shape, pageAnchor)

        if (!targetContainer) {
            const bindings = this.editor.getBindingsToShape<LayoutBinding>(
                shape,
                LAYOUT_TYPE
            )
            this.editor.deleteBindings(bindings)
            return
        }

        const index = this.getBindingIndexForPosition(
            shape,
            targetContainer,
            pageAnchor
        )

        const existingBinding = this.editor
            .getBindingsFromShape<LayoutBinding>(targetContainer, LAYOUT_TYPE)
            .find((b) => b.toId === shape.id)

        if (existingBinding) {
            if (existingBinding.props.index === index) return

            this.editor.updateBinding({
                ...existingBinding,
                props: {
                    ...existingBinding.props,
                    placeholder: true,
                    index,
                },
            })
        } else {
            this.editor.createBinding({
                id: createBindingId(),
                type: LAYOUT_TYPE,
                fromId: targetContainer.id,
                toId: shape.id,
                props: {
                    index,
                    placeholder: true,
                },
            })
        }
    }

    override onTranslateEnd(_: ElementShape, shape: ElementShape) {
        const pageAnchor = this.editor
            .getShapePageTransform(shape)
            .applyToPoint({ x: 50, y: 50 })

        const targetContainer = this.getTargetContainer(shape, pageAnchor)

        if (!targetContainer) return

        const index = this.getBindingIndexForPosition(
            shape,
            targetContainer,
            pageAnchor
        )

        this.editor.deleteBindings(
            this.editor.getBindingsToShape<LayoutBinding>(shape, LAYOUT_TYPE)
        )

        this.editor.createBinding({
            id: createBindingId(),
            type: LAYOUT_TYPE,
            fromId: targetContainer.id,
            toId: shape.id,
            props: {
                index,
                placeholder: false,
            },
        })
    }
}
