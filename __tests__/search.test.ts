import { expect, test } from 'vitest'
import { v4 as uuid } from 'uuid'

import { filter as doFilter } from '../frontend/src/js/utils/search'
import { searchGroupFromSavedSearch, type ISearchGroup } from '../frontend/src/js/AdvancedSearch'
import { type Log } from '../frontend/src/js/App'
import { type SavedSearch } from '../frontend/src/js/SavedSearch'

const testData: readonly Log[] = Object.freeze(
	convertTestDataFormat([
		'test',
		'testing',
		'this is a test',
		'Birch is a Minecraft log viewer',
		'MUCH TESTING such wow'
]));

function convertTestDataFormat(text: string[]): Log[] {
	return text.map(e => ({
		id: uuid(),
		text: e
	}));
}

function extractTextFromResult(result: Log[]): string[] {
	return result.map(e => e.text);
}

function filter(t: string | ISearchGroup) {
	return testData.filter(e => doFilter(false, t, e))
}

interface Test {
	name: string
	expected: string[]
	search: string | SavedSearch
}

const tests: Test[] = [
	{
		name: 'simple search',
		expected: [
			'testing',
			'MUCH TESTING such wow'
		],
		search: 'testing'
	},
	{
		name: 'advanced search with no inputs and all-include options',
		expected: testData.map(e => e.text),
		search: {
			mode: 'all',
			type: 'include',
			terms: []
		}
	},
	{
		name: 'advanced search with single input and all-include options',
		expected: [
			'testing',
			'MUCH TESTING such wow'
		],
		search: {
			mode: 'all',
			type: 'include',
			terms: [
				'testing'
			]
		}
	},
	{
		name: 'advanced search with single input and all-exclude options',
		expected: [
			'test',
			'this is a test',
			'Birch is a Minecraft log viewer'
		],
		search: {
			mode: 'all',
			type: 'exclude',
			terms: [
				'testing'
			]
		}
	},
	{
		name: 'advanced search with two inputs and all-include options',
		expected: [
			'testing',
			'MUCH TESTING such wow'
		],
		search: {
			mode: 'all',
			type: 'include',
			terms: [
				'test',
				'ING'
			]
		}
	},
	{
		name: 'advanced search with two inputs and all-exclude options',
		expected: [
			'test',
			'this is a test',
			'Birch is a Minecraft log viewer'
		],
		search: {
			mode: 'all',
			type: 'exclude',
			terms: [
				'test',
				'ING'
			]
		}
	},
	{
		name: 'advanced search with two inputs and any-include options',
		expected: [
			'test',
			'testing',
			'this is a test',
			'MUCH TESTING such wow'
		],
		search: {
			mode: 'any',
			type: 'include',
			terms: [
				'test',
				'ING'
			]
		}
	},
	{
		name: 'advanced search with two inputs and any-exclude options',
		expected: [
			'Birch is a Minecraft log viewer'
		],
		search: {
			mode: 'any',
			type: 'exclude',
			terms: [
				'test',
				'ING'
			]
		}
	},
	{
		name: 'advanced search with two search groups and all-include options',
		expected: [
			'MUCH TESTING such wow'
		],
		search: {
			mode: 'all',
			type: 'include',
			terms: [
				{
					mode: 'all',
					type: 'include',
					terms: [
						'test',
						'ing'
					]
				},
				{
					mode: 'all',
					type: 'include',
					terms: [
						'such wow'
					]
				}
			]
		}
	},
	{
		name: 'advanced search with two search groups and all-include options that returns empty result',
		expected: [],
		search: {
			mode: 'all',
			type: 'include',
			terms: [
				{
					mode: 'all',
					type: 'include',
					terms: [
						'test',
						'ing'
					]
				},
				{
					mode: 'all',
					type: 'include',
					terms: [
						'minecraft'
					]
				}
			]
		}
	},	
	{
		name: 'advanced search with two search groups and any-include options',
		expected: [
			'testing',
			'Birch is a Minecraft log viewer',
			'MUCH TESTING such wow'
		],
		search: {
			mode: 'any',
			type: 'include',
			terms: [
				{
					mode: 'all',
					type: 'include',
					terms: [
						'test',
						'ing'
					]
				},
				{
					mode: 'all',
					type: 'include',
					terms: [
						'minecraft'
					]
				}
			]
		}
	},
	{
		name: 'advanced search with two search groups and any-exclude options',
		expected: [
			'test',
			'testing',
			'this is a test',
			'Birch is a Minecraft log viewer',
			'MUCH TESTING such wow'
		],
		search: {
			mode: 'any',
			type: 'exclude',
			terms: [
				{
					mode: 'all',
					type: 'include',
					terms: [
						'test',
						'ing'
					]
				},
				{
					mode: 'all',
					type: 'include',
					terms: [
						'minecraft server'
					]
				}
			]
		}
	}
];

for (let t of tests) {
	test(t.name, () => {
		let searchResult: string[];
		if (typeof t.search === 'string') {
			searchResult = extractTextFromResult(filter(t.search));
		} else {
			searchResult = extractTextFromResult(filter(searchGroupFromSavedSearch(t.search)));
		}

		expect(searchResult).toEqual(t.expected);
	});
}