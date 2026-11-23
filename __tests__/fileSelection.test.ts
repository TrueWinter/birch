import { expect, test } from 'vitest'

import { selectFile } from '../frontend/src/js/utils/fileSelection'

const files = ['a.log', 'b.log', 'c.log', 'd.log'];

test('a plain click replaces the selection and sets the anchor', () => {
	const result = selectFile(files, new Set(['a.log', 'b.log']), 'a.log', 'c.log', {
		ctrl: false,
		shift: false
	});

	expect(result.selected).toEqual(new Set(['c.log']));
	expect(result.anchor).toBe('c.log');
});

test('ctrl click adds to the existing selection', () => {
	const result = selectFile(files, new Set(['a.log']), 'a.log', 'c.log', {
		ctrl: true,
		shift: false
	});

	expect(result.selected).toEqual(new Set(['a.log', 'c.log']));
	expect(result.anchor).toBe('c.log');
});

test('ctrl click on an already selected file removes it', () => {
	const result = selectFile(files, new Set(['a.log', 'c.log']), 'a.log', 'c.log', {
		ctrl: true,
		shift: false
	});

	expect(result.selected).toEqual(new Set(['a.log']));
	expect(result.anchor).toBe('c.log');
});

test('shift click selects the range between the anchor and the click', () => {
	const result = selectFile(files, new Set(['b.log']), 'b.log', 'd.log', {
		ctrl: false,
		shift: true
	});

	expect(result.selected).toEqual(new Set(['b.log', 'c.log', 'd.log']));
	expect(result.anchor).toBe('b.log');
});

test('shift click selects a range in either direction', () => {
	const result = selectFile(files, new Set(['c.log']), 'c.log', 'a.log', {
		ctrl: false,
		shift: true
	});

	expect(result.selected).toEqual(new Set(['a.log', 'b.log', 'c.log']));
	expect(result.anchor).toBe('c.log');
});

test('ctrl and shift select a non-continuous range', () => {
	const result = selectFile(files, new Set(['a.log']), 'a.log', 'c.log', {
		ctrl: true,
		shift: true
	});

	expect(result.selected).toEqual(new Set(['a.log', 'b.log', 'c.log']));
});

test('shift click without a previous click selects one file', () => {
	const result = selectFile(files, new Set(), null, 'c.log', {
		ctrl: false,
		shift: true
	});

	expect(result.selected).toEqual(new Set(['c.log']));
	expect(result.anchor).toBe('c.log');
});

test('shift click falls back to one file when the anchor is not visible', () => {
	const visible = ['a.log', 'c.log', 'd.log'];
	const result = selectFile(visible, new Set(['b.log']), 'b.log', 'd.log', {
		ctrl: false,
		shift: true
	});

	expect(result.selected).toEqual(new Set(['d.log']));
	expect(result.anchor).toBe('d.log');
});
