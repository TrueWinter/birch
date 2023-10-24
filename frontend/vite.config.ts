import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import babel from 'vite-plugin-babel'
import autoprefixer from 'autoprefixer'

// https://vitejs.dev/config/
export default defineConfig({
	css: {
		postcss: {
			plugins: [
				autoprefixer() as any
			]
		}
	},
	plugins: [babel({
		babelConfig: {
			plugins: [
				// Required for react-markdown to work
				'babel-plugin-transform-object-hasown'
			]
		}
	}) as any, 
	react()]
})