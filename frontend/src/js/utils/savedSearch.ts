import { v4 as uuid } from 'uuid'

import type { ISearchGroup } from '../AdvancedSearch'
import type { SavedSearch } from '../SavedSearch'

const SearchModeValues = ['all', 'any']
const SearchTypeValues = ['include', 'exclude']

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

export function savedSearchFromSearchGroup(search: ISearchGroup): SavedSearch {
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
