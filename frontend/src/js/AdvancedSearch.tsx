import { useEffect, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'
import Overlay from './Overlay'
import CloseButton from './CloseButton'
import LoadSavedSearch from './LoadSavedSearch'
import SaveSearch from './SaveSearch'
import SearchGroup from './AdvancedSearch/SearchGroup'
import { SavedSearch } from './SavedSearch'

import { ChangeSetting } from '../../wailsjs/go/main/App'

import css from '../css/AdvancedSearch.module.css'
import commonCss from '../css/_common.module.css'

export type InputValue = string | ISearchGroup

export interface Input {
	key: string
	value: InputValue
}

const SearchModeValues = ['all', 'any'] as const
export type SearchMode = typeof SearchModeValues[number]

export interface ISearchGroup {
	mode: SearchMode
	terms: Input[]
}

interface AdvancedSearchProps {
	setAdvancedSearchShown: Function
	setSearchQuery: React.Dispatch<React.SetStateAction<InputValue>>
	searchQuery: InputValue
}

export default function AdvancedSearch({
	setAdvancedSearchShown,
	setSearchQuery,
	searchQuery
}: AdvancedSearchProps) {
	const [searchData, setSearchData] = useState({
		mode: 'all',
		terms: []
	} as ISearchGroup);
	const [loadSavedSearchShown, setLoadSavedSearchShown] = useState(false);
	const [loadSavedSearchRenderCount, setLoadSavedSearchRenderCount] = useState(0);
	const [saveSearchShown, setSaveSearchShown] = useState(false);
	const thisRef = useRef(null);

	function search() {
		setSearchQuery(searchData)
		setAdvancedSearchShown(false)
	}

	function clearInputs(add: boolean = false) {
		setSearchData({
			mode: 'all',
			terms: add ? [{
				key: uuid(),
				value: ''
			}] : []
		})
	}

	function searchGroupFromSavedSearch(search: SavedSearch): ISearchGroup {
		let searchGroup: ISearchGroup = {
			// If the user has an invalid search mode, don't search using that.
			// Instead, use the default search mode.
			mode: SearchModeValues.includes(search.mode) ? search.mode : 'all',
			terms: []
		};

		for (let term of search.terms) {
			searchGroup.terms.push({
				key: uuid(),
				value: typeof term === 'string' ? term : searchGroupFromSavedSearch(term)
			})
		}

		return searchGroup;
	}

	function savedSearchFromSearchGroup(search: ISearchGroup): SavedSearch {
		let savedSearch: SavedSearch = {
			mode: search.mode,
			terms: []
		}

		for (let term of search.terms) {
			if (typeof term.value === 'string') {
				savedSearch.terms.push(term.value)
			} else {
				savedSearch.terms.push(savedSearchFromSearchGroup(term.value))
			}
		}

		return savedSearch;
	}

	function loadSavedSearch(data: string) {
		let query: SavedSearch = JSON.parse(atob(data));
		setSearchData(searchGroupFromSavedSearch(query));
		setLoadSavedSearchShown(false);
	}

	function deleteSavedSearch(name: string) {
		ChangeSetting('SavedSearchQueries', {
			key: name,
			value: null as any
		}).then(() => {
			// Hacky way of forcing LoadSavedSearch to re-render
			// without moving its state into the parent component
			setLoadSavedSearchRenderCount(s => s + 1);
		});
	}

	function saveSearch(name: string) {
		const toSave: SavedSearch = savedSearchFromSearchGroup(searchData);

		if (!name || !name.trim()) {
			return alert('Cannot save search query with blank name');
		}

		if (toSave.terms.filter(e => e).length === 0) {
			return alert('Cannot save blank search query');
		}

		ChangeSetting('SavedSearchQueries', {
			key: name,
			value: btoa(JSON.stringify(toSave))
		});

		setSaveSearchShown(false);
	}

	useEffect(() => {
		if (typeof searchQuery === 'object') {
			setSearchData(searchQuery);
		}

		return () => clearInputs(true);
	}, []);

	return (
		<>
			<div className={commonCss.popup} ref={thisRef}>
				<Overlay id="search" shown={loadSavedSearchShown || saveSearchShown} parentRef={thisRef} />
				<h1 className={commonCss.headingWithButton}>Advanced Search
					<CloseButton onClick={() => setAdvancedSearchShown(false)} />
				</h1>
				<div className={css.instruction}>Press the search button in the header to return to simple search mode</div>
				<hr/>

				<SearchGroup id={undefined /* root doesn't need key */} searchData={searchData} setSearchData={setSearchData} />

				<div className="input-box">
					<button className={['input', css.actionButton].join(' ')} onClick={search}>Search</button>
					<button className={['input', css.reset, css.actionButton].join(' ')} onClick={() => clearInputs()}>Reset</button>
					<button className={['input', css.actionButton].join(' ')} onClick={() => setSaveSearchShown(true)}>Save</button>
					<button className={['input', css.actionButton].join(' ')} onClick={() => setLoadSavedSearchShown(true)}>Load</button>
				</div>
			</div>

			{loadSavedSearchShown && <LoadSavedSearch setLoadSavedSearchShown={setLoadSavedSearchShown}
				loadSavedSearch={loadSavedSearch} deleteSavedSearch={deleteSavedSearch} loadSavedSearchRenderCount={loadSavedSearchRenderCount}
			/>}

			{saveSearchShown && <SaveSearch setSaveSearchShown={setSaveSearchShown} saveSearch={saveSearch} />}
		</>
	)
}