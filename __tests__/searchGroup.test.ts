import { test, expect } from 'vitest'

import { findNestedInput, findGroupParent } from '../frontend/src/js/utils/searchGroup'
import type { ISearchGroup, Input } from '../frontend/src/js/AdvancedSearch';

let inputs: readonly Input[] = Object.freeze([{
	key: '1',
	value: {
		mode: 'all',
		type: 'include',
		terms: [
			{
				key: '2',
				value: 'this is a nested input'
			},
			{
				key: '3',
				value: 'another one'
			},
			{
				key: '4',
				value: {
					mode: 'all',
					type: 'include',
					terms: [
						{
							key: '5',
							value: 'but this is the one i\'m looking for'
						},
						{
							key: '6',
							value: {
								mode: 'all',
								type: 'include',
								terms: [
									{
										key: '7',
										value: 'much nested such wow'
									}
								]
							}
						}
					]
				}
			}
		]
	}
}]);

test('find nested input', () => {
	let nestedInput = findNestedInput(inputs as Input[], '5');
	expect(nestedInput === undefined).toBeFalsy();
	// @ts-ignore
	expect(nestedInput.value).toEqual('but this is the one i\'m looking for');
});

test('find group parent', () => {
	let groupParent = findGroupParent(inputs[0].value as ISearchGroup, '6');
	expect(groupParent === undefined).toBeFalsy();
	// @ts-ignore
	expect(groupParent.terms[0].value).toEqual('but this is the one i\'m looking for');
});

test('find root input', () => {
	const input = findNestedInput(inputs as Input[], '1');
	expect(input).toBe(inputs[0]);
});

test('find deeply nested input', () => {
	const input = findNestedInput(inputs as Input[], '7');
	expect(input?.value).toEqual('much nested such wow');
});

test('missing nested input returns undefined', () => {
	expect(findNestedInput(inputs as Input[], 'missing')).toBeUndefined();
});

test('find direct group parent', () => {
	const parent = findGroupParent(inputs[0].value as ISearchGroup, '5');
	expect(parent?.terms.map(t => t.key)).toEqual(['5', '6']);
});

test('find deeply nested group parent', () => {
	const parent = findGroupParent(inputs[0].value as ISearchGroup, '7');
	expect(parent?.terms.map(t => t.key)).toEqual(['7']);
});

test('missing group parent returns undefined', () => {
	expect(findGroupParent(inputs[0].value as ISearchGroup, 'missing')).toBeUndefined();
});
