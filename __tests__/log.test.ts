import { expect, test } from 'vitest'

import { bracketFix, splitLogChunk } from '../frontend/src/js/utils/log'

test('bracketFix prepends a bracket when one is missing', () => {
	expect(bracketFix('CHAT] hello')).toBe('[CHAT] hello');
	expect(bracketFix('test')).toBe('[test');
});

test('bracketFix leaves bracketed and empty strings alone', () => {
	expect(bracketFix('[CHAT] hello')).toBe('[CHAT] hello');
	expect(bracketFix('')).toBe('');
});

test('splitLogChunk keeps a single line intact', () => {
	expect(splitLogChunk('CHAT] hello')).toEqual(['[CHAT] hello']);
});

test('splitLogChunk splits multiple log lines and restores brackets', () => {
	expect(splitLogChunk('[CHAT] first\n[CHAT] second')).toEqual([
		'[CHAT] first',
		'[CHAT] second'
	]);
});

test('splitLogChunk preserves continuation lines without a leading bracket', () => {
	expect(splitLogChunk('[CHAT] first\n  continuation')).toEqual([
		'[CHAT] first\n  continuation'
	]);
});
