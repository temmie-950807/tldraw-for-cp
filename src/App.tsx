import {
    DefaultColorStyle,
    DefaultDashStyle,
    DefaultFillStyle,
    DefaultFontStyle,
    DefaultSizeStyle,
    Tldraw,
} from "tldraw"
import { customAssetUrls } from "./asset"
import { uiOverrides, components } from "./ui-overrides"
import { DrawArray } from "./tools/array/index"
import { DrawGrid } from "./tools/grid"
import { DrawGraph } from "./tools/graph"
import { AddCode, CodeUtil } from "./tools/code"
import { DrawLatex } from "./tools/latex/LatexShapeTool"
import { LatexUtil } from "./tools/latex/LatexShapeUtil"
import { DrawAi } from "./tools/ai/ai"
import "./tools/array/styles.css"

const customTools = [DrawArray, DrawGrid, DrawGraph, AddCode, DrawLatex, DrawAi]
const customShape = [CodeUtil, LatexUtil]

// 設定預設調色板
DefaultColorStyle.setDefaultValue("black");
DefaultFontStyle.setDefaultValue("mono");
DefaultFillStyle.setDefaultValue("semi");
DefaultDashStyle.setDefaultValue("solid");
DefaultSizeStyle.setDefaultValue("m");

export default function App() {
    return (
        <div style={{ position: "fixed", inset: 0 }}>
            <Tldraw
                persistenceKey="temmieowo"
                tools={customTools}
                initialState="select"
                shapeUtils={customShape}
                overrides={uiOverrides}
                components={components}
                assetUrls={customAssetUrls}
            />
        </div>
    )
}