import CloseButton from './CloseButton'

import css from '../css/FileSelector.module.css'

import { OpenLogFile } from '../../wailsjs/go/main/App'

interface FileSelectorProps {
	setFileSelectorShown: Function
}

export default function FileSelector({
	setFileSelectorShown
}: FileSelectorProps) {
	return (
		<div className={css.popup}>
			<CloseButton onClick={() => setFileSelectorShown(false)}/>
			<h1 className={css.heading}>Load&nbsp;Log&nbsp;File</h1>
			<hr/>
			<p>You can select a log file (in either a <code>.log</code> format, or a <code>.log.gz</code> format). Note that this will be loaded in this instance of Birch, replacing the currently open log file, and updates to the file will not be shown automatically.</p>
			<div>
				<button type="button" className={css.button} onClick={OpenLogFile}>Select log file</button>
			</div>
		</div>
	)
}