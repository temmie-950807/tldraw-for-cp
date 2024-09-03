import {
    DefaultKeyboardShortcutsDialog,
    DefaultKeyboardShortcutsDialogContent,
    DefaultToolbar,
    DefaultToolbarContent,
    TLComponents,
    TldrawUiMenuItem,
    TLUiActionsContextType,
    TLUiOverrides,
    useIsToolSelected,
    useTools,
} from "tldraw"

export const uiOverrides: TLUiOverrides = {
    //[a]
	actions(_editor, actions): TLUiActionsContextType {
		const newActions = {
			...actions,
			"unlock-all": { ...actions["unlock-all"], kbd: "?!l" },
            "copy-as-png": {...actions["copy-as-png"], kbd: "?!c"},
		}

		return newActions
	},
    tools(editor, tools) {
        tools.array = {
            id: "array",
            icon: "array-icon",
            label: "Array",
            kbd: "p",
            onSelect: () => {
                editor.setCurrentTool("array")
            },
        },
        tools.grid = {
            id: "grid",
            icon: "grid-icon",
            label: "Grid",
            kbd: "i",
            onSelect: () => {
                editor.setCurrentTool("grid")
            },
        },
        tools.graph = {
            id: "graph",
            icon: "graph-icon",
            label: "Graph",
            kbd: "g",
            onSelect: () => {
                editor.setCurrentTool("graph")
            },
        },
        tools.code = {
            id: "code",
            icon: "code-icon",
            label: "Code",
            kbd: "c",
            onSelect: () => {
                editor.setCurrentTool("code")
            },
        }
        return tools
    },
}

export const components: TLComponents = {
    Toolbar: (props) => {
        const tools = useTools()
        const isArraySelected = useIsToolSelected(tools["array"])
        const isGridSelected = useIsToolSelected(tools["grid"])
        const isGraphSelected = useIsToolSelected(tools["graph"])
        const isCodeSelected = useIsToolSelected(tools["code"])
        return (
            <DefaultToolbar {...props}>
                <DefaultToolbarContent />
                <TldrawUiMenuItem {...tools["array"]} isSelected={isArraySelected} />
                <TldrawUiMenuItem {...tools["grid"]} isSelected={isGridSelected} />
                <TldrawUiMenuItem {...tools["graph"]} isSelected={isGraphSelected} />
                <TldrawUiMenuItem {...tools["code"]} isSelected={isCodeSelected} />
            </DefaultToolbar>
        )
    },
    KeyboardShortcutsDialog: (props) => {
        const tools = useTools()
        return (
            <DefaultKeyboardShortcutsDialog {...props}>
                <DefaultKeyboardShortcutsDialogContent />
                <TldrawUiMenuItem {...tools["array"]} />
                <TldrawUiMenuItem {...tools["grid"]} />
                <TldrawUiMenuItem {...tools["graph"]} />
                <TldrawUiMenuItem {...tools["code"]} />
            </DefaultKeyboardShortcutsDialog>
        )
    },
}