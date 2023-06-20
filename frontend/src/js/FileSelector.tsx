import { useEffect, useRef, useState, MouseEvent } from 'react'
import CloseButton from './CloseButton'

import { GetFilesInLogDirectory, OpenLogFile, OpenLogFileWithName } from '../../wailsjs/go/main/App'
import { main } from '../../wailsjs/go/models'

import css from '../css/FileSelector.module.css'
import FileSelectorFiles from './FileSelectorFiles'

interface FileSelectorProps {
	setFileSelectorShown: Function
}

export default function FileSelector({
	setFileSelectorShown
}: FileSelectorProps) {
	const [logFiles, setLogFiles] = useState([] as main.LogFiles[]);
	const [search, setSearch] = useState('');
	const filesRef = useRef(null as unknown as HTMLDivElement);

	useEffect(() => {
		GetFilesInLogDirectory().then(setLogFiles);
	}, [])

	return (
		<div className={css.popup}>
			<CloseButton onClick={() => setFileSelectorShown(false)}/>
			<h1 className={css.heading}>Load&nbsp;Log&nbsp;File</h1>
			<hr/>
			<p>You can select a log file (in either a <code>.log</code> format, or a <code>.log.gz</code> format). Note that this will be loaded in this instance of Birch, replacing the currently open log file, and updates to the file will not be shown automatically.</p>
			<div>
				<h2 className={[css.heading, css.headingWithButton].join(' ')}>Minecraft Logs
					<button type="button" className={css.button} onClick={OpenLogFile}>Select file from other location</button>
				</h2>
				<div className={['input-box', css.searchDiv].join(' ')}>
					<input type="text" className={['input', css.search].join(' ')} placeholder="Search" onKeyUp={(e) => setSearch((e.target as HTMLInputElement).value)} />
				</div>
				<FileSelectorFiles files={logFiles} search={search} />
			</div>
			<hr />
		</div>
	)
}