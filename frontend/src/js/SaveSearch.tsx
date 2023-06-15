import { useRef } from 'react'
import CloseButton from './CloseButton'

import css from '../css/SaveSearch.module.css'

interface LoadSavedSearchProps {
	setSaveSearchShown: Function
	saveSearch: Function
}

export default function SaveSearch({
	setSaveSearchShown,
	saveSearch
}: LoadSavedSearchProps) {
	const inputRef = useRef(null);

	function save() {
		saveSearch((inputRef.current as unknown as HTMLInputElement).value);
	}

	return (
		<div className={css.popup}>
			<CloseButton onClick={() => setSaveSearchShown(false)} />
			<h1 className={css.heading}>Save&nbsp;Search&nbsp;Query</h1>
			<hr/>

			<div className="input-box">
				Name: <input className="input" type="text" ref={inputRef} />
			</div>

			<div className="input-box">
				<button className="input" onClick={save}>Save</button>
			</div>
		</div>
	)
}