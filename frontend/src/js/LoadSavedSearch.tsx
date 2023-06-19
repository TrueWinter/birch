import { useEffect, useState } from 'react'
import CloseButton from './CloseButton'
import Skeleton from './Skeleton'

import { GetSettings } from '../../wailsjs/go/main/App'

import css from '../css/SaveSearch.module.css'
import 'react-loading-skeleton/dist/skeleton.css'

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
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		GetSettings().then(settings => {
			const queries = settings.SavedSearchQueries || {};
			
			const toSave = Object.entries(queries).map(e => ({
				name: e[0],
				data: e[1] as string
			}));

			setSavedSearchQueries(toSave);
			setLoading(false);		
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

				{loading && <Skeleton height="34px" />}
			</div>
		</div>
	)
}