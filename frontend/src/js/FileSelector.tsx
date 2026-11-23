import { MouseEvent, useState } from 'react'
import { Modal, Button, Flex, TextInput } from '@mantine/core'
import { ModalBaseProps } from './App'
import FileSelectorFiles from './FileSelectorFiles'
import { selectFile } from './utils/fileSelection'

import { GetFilesInLogDirectory, OpenLogFiles, OpenLogFilesWithNames } from '../../wailsjs/go/main/App'
import { main } from '../../wailsjs/go/models'

export default function FileSelector({
	opened,
	close
}: ModalBaseProps) {
	const [logFiles, setLogFiles] = useState([] as main.LogFiles[]);
	const [search, setSearch] = useState('');
	const [selected, setSelected] = useState(new Set<string>());
	const [anchor, setAnchor] = useState(null as string | null);

	const [prevOpened, setPrevOpened] = useState(false);
	if (opened != prevOpened) {
		if (opened) {
			setSearch('');
			setSelected(new Set());
			setAnchor(null);
			GetFilesInLogDirectory().then(setLogFiles);
		}
		setPrevOpened(opened);
	}

	function handleFileClick(path: string, event: MouseEvent<HTMLDivElement>) {
		const visiblePaths = logFiles.filter(e => e.Name.includes(search)).map(e => e.Path);
		const next = selectFile(visiblePaths, selected, anchor, path, {
			ctrl: event.ctrlKey || event.metaKey,
			shift: event.shiftKey
		});

		setSelected(next.selected);
		setAnchor(next.anchor);
	}

	function loadSelected() {
		if (selected.size === 0) return;
		OpenLogFilesWithNames([...selected]);
	}

	return (
		<Modal opened={opened} onClose={close} title="Load Log Files" centered>
			<div>You can select one or more log files (in either a <code>.log</code> format, or a <code>.log.gz</code> format). Use Ctrl to add or remove files and Shift to select a range. Note that these will be loaded in this instance of Birch, replacing the currently open log file, and updates to the file will not be shown automatically.</div>
			<Flex align="center" justify="space-between">
				<h2>Minecraft Logs</h2>
				<Button size="compact-sm" onClick={OpenLogFiles}>Select files from other location</Button>
			</Flex>
			<TextInput placeholder="Search" onKeyUp={(e) => setSearch((e.target as HTMLInputElement).value)} style={{
				marginBottom: '4px'
			}} />
			<FileSelectorFiles files={logFiles} search={search} selected={selected} onFileClick={handleFileClick} />
			<Flex align="center" justify="space-between" mt="sm">
				<div>{selected.size} file{selected.size === 1 ? '' : 's'} selected</div>
				<Button size="compact-sm" onClick={loadSelected} disabled={selected.size === 0}>Load selected</Button>
			</Flex>
		</Modal>
	)
}
