import CloseButton from './CloseButton'

import css from '../css/SaveSearch.module.css'

import { GetSettings } from '../../wailsjs/go/main/App'
import { useEffect, useRef, useState } from 'react'

interface LoadSavedSearchProps {
	setLoadSavedSearchShown: Function
	loadSavedSearch: Function
	deleteSavedSearch: Function,
	loadSavedSearchRenderCount: number
}

interface SavedSearchQuery {
	name: string
	data: string
}

export default function LoadSavedSearch({
	setLoadSavedSearchShown,
	loadSavedSearch,
	deleteSavedSearch,
	loadSavedSearchRenderCount
}: LoadSavedSearchProps) {
	const [savedSearchQueries, setSavedSearchQueries] = useState([] as SavedSearchQuery[]);

	useEffect(() => {
		GetSettings().then(settings => {
			const queries = settings.SavedSearchQueries || {};
			
			const toSave = Object.entries(queries).map(e => ({
				name: e[0],
				data: e[1] as string
			}));

			setSavedSearchQueries(toSave);
		});
	}, [loadSavedSearchRenderCount]);

	return (
		<div className={css.popup} data-r={loadSavedSearchRenderCount}>
			<CloseButton onClick={() => setLoadSavedSearchShown(false)}/>
			<h1 className={css.heading}>Load&nbsp;Saved&nbsp;Search&nbsp;Query</h1>
			<hr/>

			<div>
				{savedSearchQueries.map(e =>
					<div className={['input-box', css.mb8].join(' ')} key={e.name}>
						<span>{e.name}</span>
						<button className={['input', css.button].join(' ')} onClick={() => loadSavedSearch(e.data)}>Load</button>
						<button className={['input', css.button, css.delete].join(' ')} onClick={() => deleteSavedSearch(e.name)}>Delete</button>
					</div>
				)}
			</div>
		</div>
	)
}