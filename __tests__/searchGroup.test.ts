import { test, expect } from 'vitest'

import { findNestedInput, findGroupParent } from '../frontend/src/js/utils/searchGroup'
import { ISearchGroup, type Input } from '../frontend/src/js/AdvancedSearch';

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