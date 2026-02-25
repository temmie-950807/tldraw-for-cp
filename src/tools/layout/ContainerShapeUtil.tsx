import {
    HTMLContainer,
    RecordProps,
    Rectangle2d,
    ShapeUtil,
    T,
    TLBaseShape,
    TLShapeUtilCanBindOpts,
} from "tldraw"

export const CONTAINER_TYPE = "container"
export const CONTAINER_PADDING = 24

export type ContainerShape = TLBaseShape<
    typeof CONTAINER_TYPE,
    { height: number; width: number }
>

export class ContainerShapeUtil extends ShapeUtil<ContainerShape> {
    static override type = CONTAINER_TYPE

    static override props: RecordProps<ContainerShape> = {
        height: T.number,
        width: T.number,
    }

    override getDefaultProps() {
        return {
            width: 100 + CONTAINER_PADDING * 2,
            height: 100 + CONTAINER_PADDING * 2,
        }
    }

    override canBind({
        fromShapeType,
        toShapeType,
        bindingType,
    }: TLShapeUtilCanBindOpts<ContainerShape>) {
        return (
            fromShapeType === CONTAINER_TYPE &&
            toShapeType === "element" &&
            bindingType === "layout"
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

    override getGeometry(shape: ContainerShape) {
        return new Rectangle2d({
            width: shape.props.width,
            height: shape.props.height,
            isFilled: true,
        })
    }

    override component(shape: ContainerShape) {
        return (
            <HTMLContainer
                style={{
                    backgroundColor: "#efefef",
                    width: shape.props.width,
                    height: shape.props.height,
                    borderRadius: "12px",
                }}
            />
        )
    }

    override indicator(shape: ContainerShape) {
        return (
            <rect
                rx={12}
                ry={12}
                width={shape.props.width}
                height={shape.props.height}
            />
        )
    }
}
