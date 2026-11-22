import { expect, test } from 'vitest'

import { savedSearchFromSearchGroup, searchGroupFromSavedSearch } from '../frontend/src/js/utils/savedSearch'
import type { ISearchGroup } from '../frontend/src/js/AdvancedSearch'
import type { SavedSearch } from '../frontend/src/js/SavedSearch'

test('converts a saved search into a search group', () => {
	const saved: SavedSearch = {
		mode: 'any',
		type: 'exclude',
		terms: [
			'hello',
			{
				mode: 'all',
				type: 'include',
				terms: ['world']
			}
		]
	};

	const group = searchGroupFromSavedSearch(saved);

	expect(group.mode).toBe('any');
	expect(group.type).toBe('exclude');
	expect(group.terms).toHaveLength(2);
	expect(group.terms[0].value).toBe('hello');

	const nested = group.terms[1].value as ISearchGroup;
	expect(nested.mode).toBe('all');
	expect(nested.type).toBe('include');
	expect(nested.terms[0].value).toBe('world');
});

test('generates unique keys for every input', () => {
	const group = searchGroupFromSavedSearch({
		mode: 'all',
		type: 'include',
		terms: [
			'a',
			'b',
			{
				mode: 'all',
				type: 'include',
				terms: ['c']
			}
		]
	});

	const keys = [
		group.terms[0].key,
		group.terms[1].key,
		(group.terms[2].value as ISearchGroup).terms[0].key
	];

	expect(keys.every(key => key.length > 0)).toBe(true);
	expect(new Set(keys).size).toBe(keys.length);
});

test('falls back to valid values for an invalid saved search', () => {
	const group = searchGroupFromSavedSearch({
		mode: 'invalid',
		type: 'invalid',
		terms: []
	} as unknown as SavedSearch);

	expect(group.mode).toBe('all');
	expect(group.type).toBe('include');
});

test('round-trips a search group', () => {
	const saved: SavedSearch = {
		mode: 'all',
		type: 'include',
		terms: [
			'hello',
			{
				mode: 'any',
				type: 'exclude',
				terms: ['world', 'server']
			}
		]
	};

	expect(savedSearchFromSearchGroup(searchGroupFromSavedSearch(saved))).toEqual(saved);
});

test('handles empty search groups', () => {
	const group = searchGroupFromSavedSearch({
		mode: 'all',
		type: 'include',
		terms: []
	});

	expect(group.terms).toEqual([]);
	expect(savedSearchFromSearchGroup(group)).toEqual({
		mode: 'all',
		type: 'include',
		terms: []
	});
});
