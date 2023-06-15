import { KeyboardEvent, useEffect, useRef } from 'react'

import css from '../css/Header.module.css'
import settingsIcon from '../assets/images/cogwheel.svg'
import { SearchQueryWithTerms } from './AdvancedSearch'

interface HeaderProps {
	showSettings: Function
	setHeaderHeight: Function
	clearLogs: Function
	setAdvancedSearchShown: Function
	setSearchQuery: Function
	searchQuery: string | SearchQueryWithTerms
}

export default function Header({
	showSettings,
	setHeaderHeight,
	clearLogs,
	setAdvancedSearchShown,
	setSearchQuery,
	searchQuery
}: HeaderProps) {
	const headerRef = useRef(null as unknown as HTMLDivElement);
	const searchRef = useRef(null as unknown as HTMLInputElement);

	function onKeyUp(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			search();
		}
	}

	function search() {
		setSearchQuery(searchRef.current.value)
	}

	useEffect(() => {
		setHeaderHeight(headerRef.current.clientHeight);
	}, [])

	useEffect(() => {
		if (typeof searchQuery === 'object') {
			searchRef.current.value = '';
		}
	}, [searchQuery])

	return (
		<>
			<div ref={headerRef}>
				<div className="input-box">
					<button className={['input', css.clearLogsBtn].join(' ')} onClick={() => clearLogs(null)}>Clear Logs</button>
				</div>
				<div className={css.search}>
					<div className="input-box" id="input">
						<input className="input" type="text" autoComplete="off" ref={searchRef} onKeyUp={onKeyUp} placeholder={typeof searchQuery === 'object' ? 'Using advanced search' : undefined} />
						<button className="btn" onClick={search}>Search</button>
					</div>
					<div className={css.useAdvancedSearchBtn}>
						<span onClick={() => setAdvancedSearchShown(true)}>Use advanced search</span>
					</div>
				</div>
				<div onClick={showSettings as any}>
					<img className={css.settingsBtnImg} src={settingsIcon} />
				</div>
			</div>
		</>
	)
}