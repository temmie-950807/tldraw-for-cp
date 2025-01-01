import {
	TLComponents,
	Tldraw,
	TldrawUiButton,
	TldrawUiButtonLabel,
	TldrawUiDialogBody,
	TldrawUiDialogCloseButton,
	TldrawUiDialogFooter,
	TldrawUiDialogHeader,
	TldrawUiDialogTitle,
	useDialogs,
	useToasts,
} from 'tldraw'
import 'tldraw/tldraw.css'

// There's a guide at the bottom of this file

// [1]
function MyDialog({ onClose }: { onClose(): void }) {
	return (
		<>
			<TldrawUiDialogHeader>
				<TldrawUiDialogTitle>Title</TldrawUiDialogTitle>
				<TldrawUiDialogCloseButton />
			</TldrawUiDialogHeader>
			<TldrawUiDialogBody style={{ maxWidth: 350 }}>Description...</TldrawUiDialogBody>
			<TldrawUiDialogFooter className="tlui-dialog__footer__actions">
				<TldrawUiButton type="normal" onClick={onClose}>
					<TldrawUiButtonLabel>Cancel</TldrawUiButtonLabel>
				</TldrawUiButton>
				<TldrawUiButton type="primary" onClick={onClose}>
					<TldrawUiButtonLabel>Continue</TldrawUiButtonLabel>
				</TldrawUiButton>
			</TldrawUiDialogFooter>
		</>
	)
}

// [2]
function MySimpleDialog({ onClose }: { onClose(): void }) {
	return (
		<div style={{ padding: 16 }}>
			<h2>Title</h2>
			<p>Description...</p>
			<button onClick={onClose}>Okay</button>
		</div>
	)
}

export const CustomSharePanel = () => {
	const { addToast } = useToasts()
	const { addDialog } = useDialogs()

	return (
		<div style={{ padding: 16, gap: 16, display: 'flex', pointerEvents: 'all' }}>
			<button
				onClick={() => {
					addToast({ title: 'Hello world!', severity: 'success' })
				}}
			>
				Show toast
			</button>
			<button
				onClick={() => {
					addDialog({
						component: MyDialog,
						onClose() {
							// You can do something after the dialog is closed
							void null
						},
					})
				}}
			>
				Show dialog
			</button>
			<button
				onClick={() => {
					addDialog({
						component: MySimpleDialog,
						onClose() {
							// You can do something after the dialog is closed
							void null
						},
					})
				}}
			>
				Show simple dialog
			</button>
		</div>
	)
}

const components: TLComponents = {
	SharePanel: CustomSharePanel,
}

export default function ToastsDialogsExample() {
	return (
		<div className="tldraw__editor">
			<Tldraw components={components} persistenceKey="example" />
		</div>
	)
}