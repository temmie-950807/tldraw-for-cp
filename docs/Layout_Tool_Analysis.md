# Tldraw Layout 工具實作分析報告

這份報告說明了 `src/tools/layout` 目錄下 Layout 工具目前的實作狀態與核心運作機制。該工具利用了 tldraw 的 Shape 和 Binding 系統，實作出了一個「自動排版容器（Container）與內部元素（Element）」的互動機制。

## 主要核心模組

目前 Layout 工具由以下幾個核心部分組成：

### 1. 容器形狀 (ContainerShapeUtil)
- **實作檔案**: `ContainerShapeUtil.tsx`
- **功能**: 定義了一個類型為 `container` 的形狀，用來作為其他元素的父層收納盒。
- **特性**: 
  - 不能被編輯 (`canEdit: false`) 或縮放 (`canResize: false`)，長寬由內部包含的元素數量自動推算。
  - 外觀是一個帶有圓角和灰色背景的 HTML 容器（`HTMLContainer`）。
  - 對綁定的限制是：只能允許 `container` 綁定 `element` 形狀，且綁定類型需為 `layout`。

### 2. 佈局綁定邏輯 (LayoutBindingUtil)
- **實作檔案**: `LayoutBindingUtil.tsx`
- **功能**: 定義了 `layout` 類型的綁定，用來連接 Container 與 Element，並處理自動排版。
- **機制**:
  - 每當綁定建立、變更或是綁定的形狀發生變化時（`onAfterCreate`, `onAfterChange`, `onAfterShapeChange`, `onAfterDelete`），都會觸發 `updateElementsForContainer`。
  - 這些元素的排列是橫向（一維）的序列。透過讀取綁定的 `index` 屬性（基於 fractional indexing）來決定元素在容器中的順序。
  - 自動計算並更新容器內的每個元素座標 (`shape.x`, `shape.y`) 與容器本身的總長寬尺寸。

### 3. 元素形狀 (ElementShapeUtil)
- **實作檔案**: `ElementShapeUtil.tsx`
- **功能**: 定義了類型為 `element` 的形狀，這是放置於 Container 內的個別方塊。
- **特性**:
  - **外觀與編輯**: 大小固定（`100x100`），支援多種屬性（顏色 `color`、填充 `fill`、線條 `dash`、粗細 `size`）並支援內部富文本編輯 (`TLRichText`)。
  - **拖移邏輯**:
    - **開始拖移 (`onTranslateStart`)**: 將目前所在的 Binding 設為 `placeholder: true`，讓原本的位置保留空位，不會立刻擠壓其他元素。
    - **拖移中 (`onTranslate`)**: 偵測拖移過程中是否經過了任何相容的 Container。如果是，即時計算插入位置的 Fractional Index，並即時建立或更新 `placeholder` 綁定以預覽插入結果。如果拖離所有 Container，則刪除綁定。
    - **拖移結束 (`onTranslateEnd`)**: 確定放下時，將游標下的 Container 建立最終綁定 (`placeholder: false`)。

### 4. 繪圖工具本身 (DrawLayoutTool)
- **實作檔案**: `DrawLayoutTool.tsx`
- **功能**: 工具列點擊 Layout 後的使用者操作邏輯 (`StateNode`)。
- **機制**: 覆寫 `onPointerDown` 事件。
  - 當使用者點擊畫布時，如果點擊在既有的 Container 上，會自動在該容器末端新增一個 Element。
  - 如果點擊在空白處，則會自動生成一個全新的 Container，並自帶預設的第一個 Element。

## 系統互動彙整

- **新增元素**: 使用者透過 `DrawLayoutTool` 在畫面點擊。
- **更新排列**: 元素透過 `layout` Binding 連結至 Container。每當新增元素，Binding 改變觸發 `LayoutBindingUtil` 執行重排，更新所有 Element 的實體位置 (X, Y)。
- **拖曳排列**: 使用者點選 Element 並拖移，`ElementShapeUtil` 接管拖移事件，動態計算新的 `index`，透過更新 Binding 的順序，進一步驅動 `LayoutBindingUtil` 進行視覺重排，達成流暢的 Drag-and-Drop 效果。

## 結論

目前的實作非常完整地結合了 tldraw v3 的系統（特別是 fractional index 與 BindingUtil的結合）。開發者可以藉由此種實作方式，輕易地利用 tldraw 作為具有「結構化、自動佈局」特性的白板工具，並具備優異的操作回饋。
