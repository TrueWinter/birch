declare module '*.module.css'
declare module '*.svg'

interface Window extends Window {
	VERSION: string
	logs: import('./js/App').Log[]
}