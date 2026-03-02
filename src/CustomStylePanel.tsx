import { useCallback } from "react"
import {
    DefaultStylePanel,
    DefaultStylePanelContent,
    TldrawUiSlider,
    useEditor,
    useRelevantStyles,
    useValue,
    createShapeId,
    createBindingId,
    IndexKey,
    toRichText,
    stopEventPropagation,
} from "tldraw"
import { CONTAINER_TYPE, ContainerShape } from "./tools/layout/ContainerShapeUtil"
import { LAYOUT_TYPE } from "./tools/layout/LayoutBindingUtil"
import { LayoutBinding } from "./tools/layout/LayoutBindingUtil"

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
            const actualValue = value + INDEX_MIN
            editor.updateShape({
                id: selectedContainer.id,
                type: CONTAINER_TYPE,
                props: { indexOffset: actualValue },
            })
        },
        [editor, selectedContainer]
    )

    // 切換 Split by Space
    const handleSplitToggle = useCallback(() => {
        if (!selectedContainer) return
        const newValue = !selectedContainer.props.splitBySpace
        editor.updateShape({
            id: selectedContainer.id,
            type: CONTAINER_TYPE,
            props: { splitBySpace: newValue },
        })
        // 如果有 inputText，重新同步元素
        if (selectedContainer.props.inputText.trim()) {
            syncElementsFromInput(
                editor,
                selectedContainer.id,
                selectedContainer.props.inputText,
                newValue
            )
        }
    }, [editor, selectedContainer])

    // 輸入框變化
    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!selectedContainer) return
            const inputText = e.target.value
            editor.updateShape({
                id: selectedContainer.id,
                type: CONTAINER_TYPE,
                props: { inputText },
            })
            // 同步元素
            syncElementsFromInput(
                editor,
                selectedContainer.id,
                inputText,
                selectedContainer.props.splitBySpace
            )
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
                <>
                    {/* Index Shift 滑桿 */}
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

                    {/* Split by Space 開關 + Input 輸入框 */}
                    <div className="tlui-style-panel__section" style={{ gap: "8px", display: "flex", flexDirection: "column", padding: "0 8px 8px" }}>
                        {/* Split by Space 開關 */}
                        <label
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                cursor: "pointer",
                                fontSize: "12px",
                                color: "var(--color-text-1)",
                                userSelect: "none",
                            }}
                            onPointerDown={stopEventPropagation}
                        >
                            <button
                                style={{
                                    width: "36px",
                                    height: "20px",
                                    borderRadius: "10px",
                                    border: "none",
                                    padding: "2px",
                                    cursor: "pointer",
                                    backgroundColor: selectedContainer.props.splitBySpace
                                        ? "var(--color-primary)"
                                        : "var(--color-muted-2)",
                                    position: "relative",
                                    transition: "background-color 0.2s",
                                    flexShrink: 0,
                                }}
                                onClick={handleSplitToggle}
                                onPointerDown={stopEventPropagation}
                            >
                                <div
                                    style={{
                                        width: "16px",
                                        height: "16px",
                                        borderRadius: "50%",
                                        backgroundColor: "white",
                                        position: "absolute",
                                        top: "2px",
                                        left: selectedContainer.props.splitBySpace ? "18px" : "2px",
                                        transition: "left 0.2s",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                                    }}
                                />
                            </button>
                            <span style={{ fontWeight: 500 }}>Split by Space</span>
                        </label>

                        {/* Input 輸入框 */}
                        <input
                            type="text"
                            value={selectedContainer.props.inputText}
                            onChange={handleInputChange}
                            onPointerDown={stopEventPropagation}
                            onKeyDown={(e) => {
                                e.stopPropagation()
                            }}
                            placeholder="Enter content..."
                            style={{
                                width: "100%",
                                padding: "6px 8px",
                                fontSize: "12px",
                                fontFamily: "var(--tl-font-mono)",
                                border: "1px solid var(--color-muted-2)",
                                borderRadius: "6px",
                                backgroundColor: "var(--color-panel)",
                                color: "var(--color-text-1)",
                                outline: "none",
                                boxSizing: "border-box",
                            }}
                        />
                    </div>
                </>
            )}
        </DefaultStylePanel>
    )
}

// --- 同步元素邏輯 ---

function syncElementsFromInput(
    editor: any,
    containerId: string,
    inputText: string,
    splitBySpace: boolean
) {
    const trimmed = inputText.trim()

    // 解析出目標內容陣列
    let targetContents: string[]
    if (!trimmed) {
        // 輸入為空，不做任何改變
        return
    } else if (splitBySpace) {
        targetContents = trimmed.split(/\s+/)
    } else {
        targetContents = Array.from(trimmed)
    }

    // 取得現有的 bindings
    const existingBindings = editor
        .getBindingsFromShape(containerId as any, LAYOUT_TYPE)
        .sort((a: LayoutBinding, b: LayoutBinding) => (a.props.index > b.props.index ? 1 : -1))

    const currentCount = existingBindings.length
    const targetCount = targetContents.length

    // 如果需要更多元素，建立新的
    if (targetCount > currentCount) {
        const container = editor.getShape(containerId as any)
        if (!container) return

        for (let i = currentCount; i < targetCount; i++) {
            const elementId = createShapeId()
            editor.createShape({
                id: elementId,
                type: "element",
                x: container.x + 24 + i * (100 + 24),
                y: container.y + 24,
                props: {
                    fill: "semi",
                    richText: toRichText(targetContents[i]),
                },
            })
            editor.createBinding({
                id: createBindingId(),
                type: LAYOUT_TYPE,
                fromId: containerId as any,
                toId: elementId,
                props: {
                    index: `a${i + 1}` as IndexKey,
                    placeholder: false,
                },
            })
        }
    }

    // 如果有多餘的元素，刪除
    if (targetCount < currentCount) {
        for (let i = targetCount; i < currentCount; i++) {
            const binding = existingBindings[i]
            editor.deleteBindings([binding])
            editor.deleteShape(binding.toId)
        }
    }

    // 更新現有元素的文字
    // 需要重新取得 bindings，因為可能已經改變
    const updatedBindings = editor
        .getBindingsFromShape(containerId as any, LAYOUT_TYPE)
        .sort((a: LayoutBinding, b: LayoutBinding) => (a.props.index > b.props.index ? 1 : -1))

    for (let i = 0; i < Math.min(updatedBindings.length, targetContents.length); i++) {
        const binding = updatedBindings[i]
        editor.updateShape({
            id: binding.toId,
            type: "element",
            props: {
                richText: toRichText(targetContents[i]),
            },
        })
    }
}
