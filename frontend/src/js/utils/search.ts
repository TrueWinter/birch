import { type Log } from '../App';
import { type ISearchGroup } from '../AdvancedSearch';

export function doesMatch(e: Log, query: ISearchGroup): boolean {
	if (query.terms.length === 0) return true;

	switch (query.mode) {
		case 'all':
			let matches = 0;
			let total = query.terms.length;

			for (let term of query.terms) {
				if (typeof term.value === 'string') {
					if (term.value == '') continue;
					if (e.text.toLowerCase().includes(term.value.toLowerCase())) {
						matches++;
					}
				} else {
					if (doesMatch(e, term.value)) {
						matches++;
					}
				}
			}

			return query.type === 'include' ? matches === total : matches !== total;
		case 'any':
			for (let term of query.terms) {
				if (typeof term.value === 'string') {
					if (term.value == '') continue;
					if (e.text.toLowerCase().includes(term.value.toLowerCase())) {
						return query.type === 'include';
					}
				} else {
					if (doesMatch(e, term.value)) {
						return true;
					}
				}
			}

			return query.type !== 'include';
		default:
			return false;
	}
}

export function filter(skipFilter: boolean, searchQuery: string | ISearchGroup, e: Log): boolean {
	if (skipFilter) return true;

	if (typeof searchQuery === 'string') {
		return e.text.toLowerCase().includes((searchQuery as string).toLowerCase());
	} else {
		return doesMatch(e, searchQuery);
	}
}