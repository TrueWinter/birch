import { useEffect, useState } from 'react'
import { Modal, Button, Flex, TextInput } from '@mantine/core'
import { ModalBaseProps } from './App'
import FileSelectorFiles from './FileSelectorFiles'

import { GetFilesInLogDirectory, OpenLogFile } from '../../wailsjs/go/main/App'
import { main } from '../../wailsjs/go/models'

export default function FileSelector({
	opened,
	close
}: ModalBaseProps) {
	const [logFiles, setLogFiles] = useState([] as main.LogFiles[]);
	const [search, setSearch] = useState('');

	const [prevOpened, setPrevOpened] = useState(false);
	if (opened != prevOpened) {
		if (opened) {
			setSearch('');
			GetFilesInLogDirectory().then(setLogFiles);
		}
		setPrevOpened(opened);
	}

	return (
		<Modal opened={opened} onClose={close} title="Load Log File" centered>
			<div>You can select a log file (in either a <code>.log</code> format, or a <code>.log.gz</code> format). Note that this will be loaded in this instance of Birch, replacing the currently open log file, and updates to the file will not be shown automatically.</div>
			<Flex align="center" justify="space-between">
				<h2>Minecraft Logs</h2>
				<Button size="compact-sm" onClick={OpenLogFile}>Select file from other location</Button>
			</Flex>
			<TextInput placeholder="Search" onKeyUp={(e) => setSearch((e.target as HTMLInputElement).value)} style={{
				marginBottom: '4px'
			}} />
			<FileSelectorFiles files={logFiles} search={search} />
		</Modal>
	)
}