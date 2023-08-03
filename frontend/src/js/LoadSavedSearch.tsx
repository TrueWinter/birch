import { useEffect, useState, useRef } from 'react'
import CloseButton from './CloseButton'
import Skeleton from './Skeleton'
import ImportSavedSearch from './ImportSavedSearch'
import Overlay from './Overlay'
import { main } from '../../wailsjs/go/models'
import { GetSavedSearches, ImportSearch } from '../../wailsjs/go/main/App'

import 'react-loading-skeleton/dist/skeleton.css'
import css from '../css/SaveSearch.module.css'
import commonCss from '../css/_common.module.css'

interface LoadSavedSearchProps {
	setLoadSavedSearchShown: Function
	loadSavedSearch: Function
	deleteSavedSearch: Function
	loadSavedSearchRenderCount: number
	setLoadSavedSearchRenderCount: Function
	saveSearch: Function
}

export default function LoadSavedSearch({
	setLoadSavedSearchShown,
	loadSavedSearch,
	deleteSavedSearch,
	loadSavedSearchRenderCount,
	setLoadSavedSearchRenderCount,
	saveSearch
}: LoadSavedSearchProps) {
	const [savedSearchQueries, setSavedSearchQueries] = useState([] as main.NamedSearch[]);
	const [loading, setLoading] = useState(true);
	const [importSavedSearchPopupShown, setImportSavedSearchPopupShown] = useState(false);
	const searchToImport = useRef({} as main.NamedSearch)

	function importSearch() {
		ImportSearch().then(search => {
			searchToImport.current = search;
			setImportSavedSearchPopupShown(true);
		}).catch(err => {
			alert(`An error occurred: ${err}`);
		})
	}

	useEffect(() => {
		GetSavedSearches().then(searches => {
			const queries = searches || [];
			setSavedSearchQueries(queries);
			setLoading(false);
		}).catch(err => {
			alert(`An error occurred: ${err}`);
		});
	}, [loadSavedSearchRenderCount]);

	return (
		<>
			{importSavedSearchPopupShown &&
				<ImportSavedSearch setImportSavedSearchPopupShown={setImportSavedSearchPopupShown} saveSearch={saveSearch}
				search={searchToImport.current} setLoadSavedSearchRenderCount={setLoadSavedSearchRenderCount} />
			}
			<div className={css.popup} data-r={loadSavedSearchRenderCount}>
				<Overlay id="import-saved-search" shown={importSavedSearchPopupShown} />
				<h1 className={commonCss.headingWithButton}>Load Saved Search Query
					<CloseButton onClick={() => setLoadSavedSearchShown(false)} />
				</h1>
				<hr />
				<a href="#" onClick={() => importSearch()}>Import from file</a>
				<hr />

				<div>
					{savedSearchQueries.map(e =>
						<div className={['input-box', css.mb8].join(' ')} key={e.name}>
							<span>{e.name}</span>
							<button className={['input', css.button].join(' ')} onClick={() => loadSavedSearch(e.data)}>Load</button>
							<button className={['input', css.button, css.delete].join(' ')} onClick={() => deleteSavedSearch(e.name)}>Delete</button>
						</div>
					)}

					{loading && <Skeleton height="34px" />}
				</div>
			</div>
		</>
	)
}