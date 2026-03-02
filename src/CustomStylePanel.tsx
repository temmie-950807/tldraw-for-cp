import { useCallback } from "react"
import {
    DefaultStylePanel,
    DefaultStylePanelContent,
    TldrawUiSlider,
    useEditor,
    useRelevantStyles,
    useValue,
} from "tldraw"
import { CONTAINER_TYPE, ContainerShape } from "./tools/layout/ContainerShapeUtil"

const INDEX_MIN = -1
const INDEX_MAX = 1

export function CustomStylePanel() {
    const styles = useRelevantStyles()
    const editor = useEditor()

    // 檢查是否有選取 container shape
    const selectedContainer = useValue(
        "selectedContainer",
        () => {
            const selectedIds = editor.getSelectedShapeIds()
            for (const id of selectedIds) {
                const shape = editor.getShape(id)
                if (shape?.type === CONTAINER_TYPE) {
                    return shape as ContainerShape
                }
            }
            return null
        },
        [editor]
    )

    const onHistoryMark = useCallback(
        (id: string) => editor.markHistoryStoppingPoint(id),
        [editor]
    )

    const handleOffsetChange = useCallback(
        (value: number) => {
            if (!selectedContainer) return
            // TldrawUiSlider 的 value 是 0-based step index，需要加上 INDEX_MIN 來還原實際值
            const actualValue = value + INDEX_MIN
            editor.updateShape({
                id: selectedContainer.id,
                type: CONTAINER_TYPE,
                props: { indexOffset: actualValue },
            })
        },
        [editor, selectedContainer]
    )

    // 將 container 的 indexOffset 轉換為 slider 的 step index
    const sliderValue = selectedContainer
        ? selectedContainer.props.indexOffset - INDEX_MIN
        : 0

    const labelText = selectedContainer
        ? `${selectedContainer.props.indexOffset}`
        : "0"

    return (
        <DefaultStylePanel>
            <DefaultStylePanelContent styles={styles} />
            {selectedContainer && (
                <div className="tlui-style-panel__section">
                    <span className="tlui-style-panel__section__title" style={{ paddingLeft: "12px" }}>Index Shift</span>
                    <TldrawUiSlider
                        data-testid="style.index-offset"
                        value={sliderValue}
                        label={`Start Index: ${labelText}` as any}
                        onValueChange={handleOffsetChange}
                        min={0}
                        steps={INDEX_MAX - INDEX_MIN}
                        title="Index Shift"
                        onHistoryMark={onHistoryMark}
                    />
                </div>
            )}
        </DefaultStylePanel>
    )
}
