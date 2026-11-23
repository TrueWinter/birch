import { useEffect, useRef, MouseEvent } from 'react'

import { main } from '../../wailsjs/go/models'

import css from '../css/FileSelector.module.css'
import Skeleton from './Skeleton'
import { ScrollArea } from '@mantine/core'

interface FileSelectorFilesProps {
	files: main.LogFiles[]
	search: string
	selected: Set<string>
	onFileClick: (path: string, event: MouseEvent<HTMLDivElement>) => void
}

export default function FileSelectorFiles({
	files,
	search,
	selected,
	onFileClick
}: FileSelectorFilesProps) {
	const filesRef = useRef(null as unknown as HTMLDivElement);

	useEffect(() => {
		if (filesRef.current) {
			filesRef.current.scrollTo({
				top: filesRef.current.scrollHeight
			})
		}
	}, [files, search]);

	function getFiles() {
		const l = files.filter(e => e.Name.includes(search))
			.map(e => <div
				className={selected.has(e.Path) ? `${css.file} ${css.fileSelected}` : css.file}
				key={e.Path}
				data-path={e.Path}
				onClick={(event) => onFileClick(e.Path, event)}
			>{e.Name}</div>);

		return l.length > 0 ? l : 'No files found'
	}

	return (
		<div className={css.files}>
			<ScrollArea.Autosize mah={120} scrollbars="y" offsetScrollbars viewportRef={filesRef}>
				{files.length === 0 ? <Skeleton h="1em" number={5} gap="4px" /> : getFiles()}
			</ScrollArea.Autosize>
		</div>
	)
}
