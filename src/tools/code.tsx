import {
    Geometry2d,
    HTMLContainer,
    RecordProps,
    Rectangle2d,
    ShapeUtil,
    StateNode,
    T,
    TLBaseShape,
    TLOnResizeHandler,
    resizeBox,
    useIsToolSelected,
    useTools,
} from "tldraw"
import MonacoEditor from 'react-monaco-editor';

type ICodeShapeProps = TLBaseShape<
    "vscode-editor",
    {
        w: number
        h: number
        font_size: number
        theme: string
    }
>

function AddMonaco({ h, w, font_size, theme }: { h: number, w: number, font_size: number, theme: string }) {
    const defaultCode = ["#include <iostream>", "using namespace std;", "", "int main(){", "", "\treturn 0;", "}"].join("\n");
    const options = {
        fontSize: font_size,
        minimap: { enabled: false },
        language: "C++"
    };
    return (<MonacoEditor
        height={`${h}px`}
        width={`${w}px`}
        options={options}
        theme={`vs-${theme}`}
        defaultValue={`${defaultCode}`}
    />
    );
}

export class CodeUtil extends ShapeUtil<ICodeShapeProps> {
    static override type = "vscode-editor" as const
    static override props: RecordProps<ICodeShapeProps> = {
        w: T.number,
        h: T.number,
        font_size: T.number,
        theme: T.string,
    }

    getDefaultProps(): ICodeShapeProps["props"] {
        return {
            w: 600,
            h: 400,
            font_size: 16,
            theme: "light",
        }
    }

    override canEdit = () => false
    override canResize = () => true
    override isAspectRatioLocked = () => false

    getGeometry(shape: ICodeShapeProps): Geometry2d {
        return new Rectangle2d({
            width: shape.props.w,
            height: shape.props.h,
            isFilled: true,
        })
    }

    override onResize: TLOnResizeHandler<any> = (shape, info) => {
        return resizeBox(shape, info)
    }

    component(shape: ICodeShapeProps) {
        const tools = useTools();
        const isSelectSelected = useIsToolSelected(tools["select"])

        return (
            <HTMLContainer style={{ pointerEvents: isSelectSelected ? 'all' : 'none', }}>
                <AddMonaco h={shape.props.h} w={shape.props.w} font_size={shape.props.font_size} theme={shape.props.theme} />
            </HTMLContainer>
        )
    }

    indicator(shape: ICodeShapeProps) {
        return <rect width={shape.props.w} height={shape.props.h} />
    }
}

export class AddCode extends StateNode {
    static override id = "code"
    override onEnter = () => {
        this.editor.setCursor({ type: "cross", rotation: 0 })
    }

    override onPointerDown = () => {
        const { currentPagePoint } = this.editor.inputs

        this.editor.createShape({ type: "vscode-editor", x: currentPagePoint.x - 300, y: currentPagePoint.y - 200 })
    }
}