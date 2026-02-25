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
import { DrawGrid } from "./tools/grid/index"
import { DrawGraph } from "./tools/graph/index"
import { AddCode, CodeUtil } from "./tools/code"
import { DrawLatex } from "./tools/latex/LatexShapeTool"
import { LatexUtil } from "./tools/latex/LatexShapeUtil"
import {
    ContainerShapeUtil,
    ElementShapeUtil,
    LayoutBindingUtil,
    DrawLayout,
} from "./tools/layout"
import "./tools/array/styles.css"
import "./tools/grid/styles.css"

const customTools = [DrawArray, DrawGrid, DrawGraph, AddCode, DrawLatex, DrawLayout]
const customShape = [CodeUtil, LatexUtil, ContainerShapeUtil, ElementShapeUtil]
const customBindingUtils = [LayoutBindingUtil]

// 設定預設調色板
DefaultColorStyle.setDefaultValue("black");
DefaultFontStyle.setDefaultValue("mono");
DefaultFillStyle.setDefaultValue("none");
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
                bindingUtils={customBindingUtils}
                overrides={uiOverrides}
                components={components}
                assetUrls={customAssetUrls}
            />
        </div>
    )
}