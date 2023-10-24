import { createRoot } from 'react-dom/client'
import App from './App'

import { AlertMessage } from '../../wailsjs/go/main/App'

import wailsConfig from '../../../wails.json';
window.VERSION = wailsConfig.info.productVersion;

window.alert = (message: string, title: string = 'An error occurred') => {
	AlertMessage(title, message)
}

const container = document.getElementById('main') as Element;
const root = createRoot(container);

root.render(<App />);