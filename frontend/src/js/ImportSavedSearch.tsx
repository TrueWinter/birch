import { useRef } from 'react'
import CloseButton from './CloseButton'

import { main } from '../../wailsjs/go/models'

import 'react-loading-skeleton/dist/skeleton.css'
import css from '../css/ImportSavedSearch.module.css'
import commonCss from '../css/_common.module.css'

interface ImportSavedSearchProps {
	setImportSavedSearchPopupShown: Function
	setLoadSavedSearchRenderCount: Function
	saveSearch: Function
	search: main.ImportedSearch
}

export default function ImportSavedSearch({
	setImportSavedSearchPopupShown,
	setLoadSavedSearchRenderCount,
	saveSearch,
	search
}: ImportSavedSearchProps) {
	const nameRef = useRef(null as unknown as HTMLInputElement);

	function importSearch() {
		saveSearch(nameRef.current?.value, search.data);
		setLoadSavedSearchRenderCount((s: number) => s + 1);
		setImportSavedSearchPopupShown(false);
	}

	return (
		<>
			<div className={css.popup}>
				<h1 className={commonCss.headingWithButton}>Load Saved Search Query
					<CloseButton onClick={() => setImportSavedSearchPopupShown(false)} />
				</h1>
				<hr />

				<div>
					<div className={['input-box', css.mb8].join(' ')}>
						<input className="input" type="text" defaultValue={search.name} ref={nameRef} />
					</div>

					<div className={['input-box', css.mb8].join(' ')}>
						<button className={['input', css.button].join(' ')} onClick={() => importSearch()}>Import</button>
					</div>
				</div>
			</div>
		</>
	)
}