import { useEffect, useRef, useState } from 'react'
import CloseButton from './CloseButton'
import FileSelectorFiles from './FileSelectorFiles'

import { GetFilesInLogDirectory, OpenLogFile } from '../../wailsjs/go/main/App'
import { main } from '../../wailsjs/go/models'

import css from '../css/FileSelector.module.css'
import commonCss from '../css/_common.module.css'

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
			<h1 className={commonCss.headingWithButton}>Load Log File
				<CloseButton onClick={() => setFileSelectorShown(false)}/>
			</h1>
			<hr/>
			<p>You can select a log file (in either a <code>.log</code> format, or a <code>.log.gz</code> format). Note that this will be loaded in this instance of Birch, replacing the currently open log file, and updates to the file will not be shown automatically.</p>
			<div>
				<div className="input-box">
					<h2 className={[css.heading, commonCss.headingWithButton].join(' ')}>Minecraft Logs
						<button type="button" className={['input', css.button].join(' ')} onClick={OpenLogFile}>Select file from other location</button>
					</h2>
				</div>
				<div className={['input-box', css.searchDiv].join(' ')}>
					<input type="text" className={['input', css.search].join(' ')} placeholder="Search" onKeyUp={(e) => setSearch((e.target as HTMLInputElement).value)} />
				</div>
				<FileSelectorFiles files={logFiles} search={search} />
			</div>
		</div>
	)
}