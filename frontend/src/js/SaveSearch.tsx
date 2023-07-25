import { useRef } from 'react'
import CloseButton from './CloseButton'

import css from '../css/SaveSearch.module.css'
import commonCss from '../css/_common.module.css'

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
			<h1 className={commonCss.headingWithButton}>Save Search Query
				<CloseButton onClick={() => setSaveSearchShown(false)} />
			</h1>
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