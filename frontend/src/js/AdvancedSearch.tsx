import { useEffect, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'
import LoadSavedSearch from './LoadSavedSearch'
import SaveSearch from './SaveSearch'
import SearchGroup from './AdvancedSearch/SearchGroup'
import { SavedSearch } from './SavedSearch'
import { Modal, Text, Button, Group } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'

import { DeleteSavedSearch, ExportSearchWithDialog, SaveSearchToBirchDirectory } from '../../wailsjs/go/main/App'
import { serialization } from '../../wailsjs/go/models'
import EmptyInputAlert from './AdvancedSearch/EmptyInputAlert'
import { ModalBaseProps } from './App'

export type InputValue = string | ISearchGroup

export interface Input {
	key: string
	value: InputValue
}

const SearchModeValues = ['all', 'any'] as const
export type SearchMode = typeof SearchModeValues[number]

const SearchTypeValues = ['include', 'exclude'] as const
export type SearchType = typeof SearchTypeValues[number]

export interface ISearchGroup {
	mode: SearchMode
	type: SearchType
	terms: Input[]
}

interface AdvancedSearchProps extends ModalBaseProps {
	setSearchQuery: React.Dispatch<React.SetStateAction<InputValue>>
	searchQuery: InputValue
	defaultSearch: string,
	setDefaultSearch: Function
}

export function searchGroupFromSavedSearch(search: SavedSearch): ISearchGroup {
	let searchGroup: ISearchGroup = {
		// If the user has an invalid search mode, don't search using that.
		// Instead, use the default search mode.
		mode: SearchModeValues.includes(search.mode) ? search.mode : 'all',
		type: SearchTypeValues.includes(search.type) ? search.type : 'include',
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

export default function AdvancedSearch({
	opened,
	close,
	setSearchQuery,
	searchQuery,
	defaultSearch,
	setDefaultSearch
}: AdvancedSearchProps) {
	const initialSearchData = Object.freeze({
		mode: 'all',
		type: 'include',
		terms: []
	});
	const [searchData, setSearchData] = useState<ISearchGroup>(initialSearchData);
	const [loadSavedSearchShown, { open: openLoadSavedSearch, close: closeLoadSavedSearch }] = useDisclosure(false);
	const [loadSavedSearchRenderCount, setLoadSavedSearchRenderCount] = useState(0);
	const [saveSearchShown, { open: openSaveSearch, close: closeSaveSearch }] = useDisclosure(false);
	const [emptyInputAlertShown, { open: openEmptyInputAlert, close: closeEmptyInputAlert }] = useDisclosure(false);
	const thisRef = useRef(null as unknown as HTMLDivElement);

	function search() {
		if (hasBlankTerms(searchData)) {
			openEmptyInputAlert()
		} else {
			setSearchQuery(searchData)
			close()
		}
	}

	function clearInputs(add: boolean = false) {
		setSearchData({
			mode: 'all',
			type: 'include',
			terms: add ? [{
				key: uuid(),
				value: ''
			}] : []
		})
	}

	function hasBlankTerms(search: ISearchGroup): boolean {
		for (let term of search.terms) {
			if (typeof term.value === 'string') {
				console.log('t', term.value, !term.value)
				return !term.value
			} else {
				return hasBlankTerms(term.value)
			}
		}

		return false;
	}

	function savedSearchFromSearchGroup(search: ISearchGroup): SavedSearch {
		let savedSearch: SavedSearch = {
			mode: search.mode,
			type: search.type,
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

	function loadSavedSearch(data: serialization.DSearchGroup) {
		try {
			setSearchData(searchGroupFromSavedSearch(data as SavedSearch));
			closeLoadSavedSearch();
			// https://stackoverflow.com/a/75403839
			setTimeout(() => {
				thisRef.current?.scrollTo({
					top: thisRef.current?.scrollHeight
				})
			}, 0);
		} catch(e) {
			alert(`An error occurred: ${e}`);
		}
	}

	function deleteSavedSearch(name: string) {
		DeleteSavedSearch(name).then(() => {
			// Hacky way of forcing LoadSavedSearch to re-render without moving its state into the parent component
			setLoadSavedSearchRenderCount(s => s + 1);
		}).catch(err => {
			alert(`An error occurred: ${err}`);
		});
	}

	function serializeSearch(name: string): string | void {
		const toSave: SavedSearch = savedSearchFromSearchGroup(searchData);

		if (!name || !name.trim()) {
			return alert('Cannot save search query with blank name');
		}

		if (toSave.terms.filter(e => e).length === 0) {
			return alert('Cannot save blank search query');
		}

		if (hasBlankTerms(searchData)) {
			return alert('Cannot save search with empty input(s)');
		}

		return JSON.stringify(toSave)
	}

	function saveSearch(name: string, data?: string) {
		const toSave = data ? JSON.stringify(data) : serializeSearch(name);
		if (!toSave) return;
		
		SaveSearchToBirchDirectory(name, toSave).then(() => {
			closeSaveSearch();
			setLoadSavedSearchRenderCount((s: number) => s + 1);
		}).catch(err => {
			alert(`An error occurred: ${err}`);
		});
	}

	function exportSearch(name: string) {
		const toSave = serializeSearch(name);
		if (!toSave) return;

		ExportSearchWithDialog(name, toSave).catch(err => {
			alert(`An error occurred: ${err}`)
		});
		closeSaveSearch();
	}

	if (searchData.terms.length === 0) {
		clearInputs(true);
	}

	// I know this isn't a good way to do this, but nothing else I tried worked.
	useEffect(() => {
		if (typeof searchQuery === 'object') {
			setSearchData(searchQuery);
		} else {
			setSearchData(initialSearchData);
		}
	}, [searchQuery]);

	return (
		<>
			<Modal opened={opened} onClose={close} ref={thisRef} title="Advanced Search" centered>
				<Text size="sm" style={{
					borderBottom: '1px solid grey',
					marginBottom: '12px'
				}}>Press the search button in the header to return to simple search mode</Text>

				<div style={{
					marginBottom: '8px'
				}}>
					<SearchGroup id={undefined /* root doesn't need key */} searchData={searchData} setSearchData={setSearchData} />
				</div>

				<Group justify="space-between">
					<Group gap="8px">
						<Button size="compact-md" onClick={search}>Search</Button>
						<Button size="compact-md" bg="red" onClick={() => clearInputs(true)}>Reset</Button>
					</Group>
					<Group gap="8px">
						<Button size="compact-md" onClick={() => openSaveSearch()}>Save</Button>
						<Button size="compact-md" onClick={() => openLoadSavedSearch()}>Load</Button>
					</Group>
				</Group>
			</Modal>

			<LoadSavedSearch opened={loadSavedSearchShown} close={closeLoadSavedSearch}
				loadSavedSearch={loadSavedSearch} deleteSavedSearch={deleteSavedSearch}
				loadSavedSearchRenderCount={loadSavedSearchRenderCount}
				setLoadSavedSearchRenderCount={setLoadSavedSearchRenderCount}
				saveSearch={saveSearch} defaultSearch={defaultSearch} setDefaultSearch={setDefaultSearch}
			/>

			<SaveSearch opened={saveSearchShown} close={closeSaveSearch} saveSearch={saveSearch} exportSearch={exportSearch} />
			<EmptyInputAlert opened={emptyInputAlertShown} close={closeEmptyInputAlert} />
		</>
	)
}