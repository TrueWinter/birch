import { useEffect, useState } from 'react'
import { v4 as uuid } from 'uuid'
import Overlay from './Overlay'
import CloseButton from './CloseButton'
import LoadSavedSearch from './LoadSavedSearch'
import SaveSearch from './SaveSearch'

import { ChangeSetting } from '../../wailsjs/go/main/App'

import css from '../css/AdvancedSearch.module.css'

interface AdvancedSearchProps {
	setAdvancedSearchShown: Function
	setSearchQuery: Function
	searchQuery: string | SearchQuery
}

interface Input {
	key: string
	value: string
}

export interface BaseSearchQuery {
	mode: string
}

export interface SearchQueryWithInputs extends BaseSearchQuery {
	inputs: string[]
}

export interface SearchQueryWithTerms extends BaseSearchQuery {
	terms: string[]
}

export type SearchQuery = SearchQueryWithInputs | SearchQueryWithTerms;

export default function AdvancedSearch({
	setAdvancedSearchShown,
	setSearchQuery,
	searchQuery
}: AdvancedSearchProps) {
	const [inputs, setInputs] = useState([] as Input[]);
	const [searchMode, setSearchMode] = useState('and');
	const [loadSavedSearchShown, setLoadSavedSearchShown] = useState(false);
	const [loadSavedSearchRenderCount, setLoadSavedSearchRenderCount] = useState(0);
	const [saveSearchShown, setSaveSearchShown] = useState(false);

	function addInput(value = '') {
		setInputs(i => ([ ...i, {
			key: uuid(),
			value
		}]))
	}

	function search() {
		setSearchQuery({
			mode: searchMode,
			terms: inputs.map(e => e.value)
		});

		setAdvancedSearchShown(false);
	}

	function clearInputs() {
		setInputs([]);
		addInput();
	}

	function setInputValue(key: string, value: string) {
		let input = inputs.find(e => e.key === key);
		if (!input) return;
		input.value = value;
		setInputs(inputs);
	}

	function loadSavedSearch(data: string) {
		let query = JSON.parse(atob(data));
		// Backwards compatability
		if (query.inputs) {
			query.terms = query.inputs;
			delete query.inputs;
		}

		setInputs([])
		for (let term of query.terms) {
			addInput(term);
		}

		console.log(query);

		setSearchMode(query.mode);
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
		const toSave = {
			mode: searchMode,
			terms: inputs.map(e => e.value)
		};

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
		if (typeof searchQuery === 'string') {
			addInput();
		} else if (typeof searchQuery === 'object') {
			setSearchMode(searchQuery.mode);
			for (let term of (searchQuery as SearchQueryWithTerms).terms) {
				addInput(term);
			}
		}

		return () => setInputs([]);
	}, []);

	return (
		<>
			<div className={css.advancedSearch}>
				<Overlay id="search" shown={loadSavedSearchShown || saveSearchShown} />
				<CloseButton onClick={() => setAdvancedSearchShown(false)} />
				<h1 className={css.heading}>Advanced Search</h1>
				<div className={css.instruction}>Press the search button in the header to return to simple search mode</div>
				<hr/>

				<div>
					{inputs.map(e => 
						<div key={e.key} className={['input-box', css.mb8].join(' ')}>
							<input className="input" type="text" defaultValue={e.value} onChange={(i) => setInputValue(e.key, i.target.value)} />
						</div>
					)}
				</div>

				<div className={['input-box', css.mb8].join(' ')}>
					Search mode: <select className="input" autoComplete="off" value={searchMode} onChange={(e) => setSearchMode(e.target.value)}>
						<option value="and">and</option>
						<option value="or">or</option>
					</select>
				</div>

				<div className="input-box">
					<button className={['input', css.actionButton].join(' ')} onClick={() => addInput()}>+</button>
					<button className={['input', css.actionButton].join(' ')} onClick={search}>Search</button>
					<button className={['input', css.reset, css.actionButton].join(' ')} onClick={clearInputs}>Reset</button>
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