import {
    BindingOnChangeOptions,
    BindingOnCreateOptions,
    BindingOnDeleteOptions,
    BindingOnShapeChangeOptions,
    BindingUtil,
    IndexKey,
    TLBaseBinding,
    Vec,
} from "tldraw"

import {
    CONTAINER_PADDING,
    CONTAINER_TYPE,
    ContainerShape,
} from "./ContainerShapeUtil"
import { ElementShape, ELEMENT_SIZE } from "./ElementShapeUtil"

export const LAYOUT_TYPE = "layout"

export type LayoutBinding = TLBaseBinding<
    typeof LAYOUT_TYPE,
    { index: IndexKey; placeholder: boolean }
>

export class LayoutBindingUtil extends BindingUtil<LayoutBinding> {
    static override type = LAYOUT_TYPE

    override getDefaultProps() {
        return {
            index: "a1" as IndexKey,
            placeholder: true,
        }
    }

    override onAfterCreate({
        binding,
    }: BindingOnCreateOptions<LayoutBinding>): void {
        this.updateElementsForContainer(binding)
    }

    override onAfterChange({
        bindingAfter,
    }: BindingOnChangeOptions<LayoutBinding>): void {
        this.updateElementsForContainer(bindingAfter)
    }

    override onAfterChangeFromShape({
        binding,
    }: BindingOnShapeChangeOptions<LayoutBinding>): void {
        this.updateElementsForContainer(binding)
    }

    override onAfterDelete({
        binding,
    }: BindingOnDeleteOptions<LayoutBinding>): void {
        this.updateElementsForContainer(binding)
    }

    private updateElementsForContainer({
        props: { placeholder },
        fromId: containerId,
        toId,
    }: LayoutBinding) {
        const container = this.editor.getShape<ContainerShape>(containerId)
        if (!container) return

        const bindings = this.editor
            .getBindingsFromShape<LayoutBinding>(container, LAYOUT_TYPE)
            .sort((a, b) => (a.props.index > b.props.index ? 1 : -1))

        if (bindings.length === 0) {
            // 沒有元素時，視作有 1 個元素來計算容器尺寸
            const width = CONTAINER_PADDING + ELEMENT_SIZE + CONTAINER_PADDING
            const height = CONTAINER_PADDING + ELEMENT_SIZE + CONTAINER_PADDING

            if (
                width !== container.props.width ||
                height !== container.props.height
            ) {
                this.editor.updateShape({
                    id: container.id,
                    type: CONTAINER_TYPE,
                    props: { width, height },
                })
            }
            return
        }

        for (let i = 0; i < bindings.length; i++) {
            const binding = bindings[i]
            if (toId === binding.toId && placeholder) continue

            const offset = new Vec(
                CONTAINER_PADDING + i * (ELEMENT_SIZE + CONTAINER_PADDING),
                CONTAINER_PADDING
            )

            const shape = this.editor.getShape<ElementShape>(binding.toId)
            if (!shape) continue

            const point = this.editor.getPointInParentSpace(
                shape,
                this.editor
                    .getShapePageTransform(container)!
                    .applyToPoint(offset)
            )

            if (shape.x !== point.x || shape.y !== point.y) {
                this.editor.updateShape({
                    id: binding.toId,
                    type: "element",
                    x: point.x,
                    y: point.y,
                })
            }
        }

        const width =
            CONTAINER_PADDING +
            (bindings.length * ELEMENT_SIZE +
                (bindings.length - 1) * CONTAINER_PADDING) +
            CONTAINER_PADDING

        const height = CONTAINER_PADDING + ELEMENT_SIZE + CONTAINER_PADDING

        if (
            width !== container.props.width ||
            height !== container.props.height
        ) {
            this.editor.updateShape({
                id: container.id,
                type: CONTAINER_TYPE,
                props: { width, height },
            })
        }
    }
}
