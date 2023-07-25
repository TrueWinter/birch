import { SearchMode } from './AdvancedSearch'

export type TermValue = string | SavedSearch

export interface SavedSearch {
	mode: SearchMode
	terms: TermValue[]
}