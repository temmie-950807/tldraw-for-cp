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
import Editor from '@monaco-editor/react';

type ICodeShapeProps = TLBaseShape<
    "vscode-editor",
    {
        w: number
        h: number
        font_size: number
        theme: string
    }
>

interface CodeEditorProps {
    h: number;
    w: number;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ h, w }) => {
    const defaultCode = ["#include <iostream>", "using namespace std;", "", "int main(){", "", "\treturn 0;", "}"].join("\n");
    const editorOptions = {
        fontSize: 22,
        minimap: {enabled: false}
    };

    console.log(h, w);
    return (
        <Editor
            height={`${h}px`}
            width={`${w}px`}
            defaultLanguage="cpp"
            theme="vs-dark"
            defaultValue={`${defaultCode}`}
            options={editorOptions}
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

        console.log(shape.props.w, shape.props.h);
        return (
            <HTMLContainer style={{ pointerEvents: isSelectSelected ? 'all' : 'none', }}>
                <CodeEditor w={shape.props.w} h={shape.props.h}/>
            </HTMLContainer>
        )
    }

    indicator(shape: ICodeShapeProps) {
        return <rect width={shape.props.w} height={shape.props.h} />
    }
}

export class AddCode extends StateNode {
    static override id = "code"
    static override isLockable = true
    override shapeType = "draw"
    override onEnter = () => {
        this.editor.setCursor({ type: "cross", rotation: 0 })
    }

    override onPointerDown = () => {
        const { currentPagePoint } = this.editor.inputs

        this.editor.createShape({ type: "vscode-editor", x: currentPagePoint.x - 300, y: currentPagePoint.y - 200 })
    }
}