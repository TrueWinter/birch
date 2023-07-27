import { SearchMode, SearchType } from './AdvancedSearch'

export type TermValue = string | SavedSearch

export interface SavedSearch {
	mode: SearchMode
	type: SearchType
	terms: TermValue[]
}