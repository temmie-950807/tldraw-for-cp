import { useSyncDemo } from '@tldraw/sync'
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
import { DrawArray } from "./tools/array"
import { DrawGrid } from "./tools/grid"
import { DrawGraph } from "./tools/graph"
import { AddCode, CodeUtil } from "./tools/code"

const customTools = [DrawArray, DrawGrid, DrawGraph, AddCode]
const customShape = [CodeUtil]

// 設定預設調色板
DefaultColorStyle.setDefaultValue("black");
DefaultFontStyle.setDefaultValue("mono");
DefaultFillStyle.setDefaultValue("semi");
DefaultDashStyle.setDefaultValue("solid");
DefaultSizeStyle.setDefaultValue("m");

export default function App({ roomId }: { roomId: string }) {
    const store = useSyncDemo({ roomId });
    return (
        <div style={{ position: "fixed", inset: 0 }}>
            <Tldraw
                // persistenceKey="temmieowo"
                store={store}
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