import { createRoot } from 'react-dom/client'
import App from './App'

import wailsConfig from '../../../wails.json';
window.VERSION = wailsConfig.info.productVersion;

const container = document.getElementById('main') as Element;
const root = createRoot(container);

root.render(<App />);