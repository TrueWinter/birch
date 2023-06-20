import { useEffect, useRef, MouseEvent } from 'react'
import Skeleton from './Skeleton'

import { OpenLogFileWithName } from '../../wailsjs/go/main/App'
import { main } from '../../wailsjs/go/models'

import css from '../css/FileSelector.module.css'

interface FileSelectorFilesProps {
	files: main.LogFiles[]
	search: string
}

export default function FileSelectorFiles({
	files,
	search
}: FileSelectorFilesProps) {
	const filesRef = useRef(null as unknown as HTMLDivElement);

	useEffect(() => {
		filesRef.current?.scrollTo({
			top: filesRef.current?.scrollHeight
		})
	}, [files, search])

	function open(e: MouseEvent<HTMLDivElement>) {
		const target = e.target as HTMLDivElement;
		OpenLogFileWithName(target.dataset.path as string);
	}

	function getFiles() {
		const l = files.filter(e => e.Name.includes(search))
		.map(e => <div className={css.file} key={e.Path} data-path={e.Path} onClick={open}>{e.Name}</div>);

		return l.length > 0 ? l : 'No files found'
	}

	return (
		<div className={css.files} ref={filesRef}>
			{files.length === 0 ? <Skeleton count={5} height="20px" /> : getFiles()}
		</div>
	)
}