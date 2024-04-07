import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import babel from 'vite-plugin-babel'
import autoprefixer from 'autoprefixer'
import presetMantine from 'postcss-preset-mantine'
import simpleVars from 'postcss-simple-vars'

// https://vitejs.dev/config/
export default defineConfig({
	css: {
		postcss: {
			plugins: [
				autoprefixer(),
				presetMantine(),
				simpleVars({
					variables: {
						'mantine-breakpoint-xs': '36em',
						'mantine-breakpoint-sm': '48em',
						'mantine-breakpoint-md': '62em',
						'mantine-breakpoint-lg': '75em',
						'mantine-breakpoint-xl': '88em'
					}
				})
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