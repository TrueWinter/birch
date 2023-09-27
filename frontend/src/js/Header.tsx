import { KeyboardEvent, useEffect, useRef } from 'react'
import { BsGear, BsFolder2Open } from 'react-icons/bs'
import { ISearchGroup } from './AdvancedSearch'

import css from '../css/Header.module.css'

interface HeaderProps {
	showSettings: Function
	showFileSelector: Function
	setHeaderHeight: Function
	clearLogs: Function
	setAdvancedSearchShown: Function
	setSearchQuery: Function
	searchQuery: string | ISearchGroup
	nonLatestFileLoaded: boolean
}

export default function Header({
	showSettings,
	showFileSelector,
	setHeaderHeight,
	clearLogs,
	setAdvancedSearchShown,
	setSearchQuery,
	searchQuery,
	nonLatestFileLoaded
}: HeaderProps) {
	const headerRef = useRef(null as unknown as HTMLDivElement);
	const searchRef = useRef(null as unknown as HTMLInputElement);

	function onKeyUp(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			search();
		}
	}

	function search() {
		setSearchQuery(searchRef.current.value);
	}

	function handleResize() {
		setHeaderHeight(headerRef.current.clientHeight);
	}

	useEffect(() => {
		handleResize();
		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		}
	}, [])

	useEffect(() => {
		if (typeof searchQuery === 'object') {
			searchRef.current.value = '';
		}
	}, [searchQuery])

	return (
		<>
			<div ref={headerRef}>
				{!nonLatestFileLoaded &&
					<div className="input-box">
						<button className={['input', css.clearLogsBtn].join(' ')} onClick={() => clearLogs(null)}>Clear Logs</button>
					</div>
				}
				{nonLatestFileLoaded && <div className={css.nonLatest}>Non-latest log file loaded</div>}
				<div className={css.search}>
					<div className="input-box" id="input">
						<input className="input" type="text" autoComplete="off" ref={searchRef} onKeyUp={onKeyUp} placeholder={typeof searchQuery === 'object' ? 'Using advanced search' : undefined} />
						<button className="btn" onClick={search}>Search</button>
					</div>
					<div className={css.useAdvancedSearchBtn}>
						<span onClick={() => setAdvancedSearchShown(true)}>Use advanced search</span>
					</div>
				</div>
				<div className={css.iconGroup}>
					<div onClick={showFileSelector as any}>
						<BsFolder2Open />
					</div>
					{!nonLatestFileLoaded && 
						<div onClick={showSettings as any}>
							<BsGear />
						</div>
					}
				</div>
			</div>
		</>
	)
}