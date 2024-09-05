import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
	base: '/tldraw-for-cp/',
	build: {
		chunkSizeWarningLimit: 10000
	},
	plugins: [react()],
})
