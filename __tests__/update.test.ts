import { expect, test } from 'vitest'

import { isVersionNewer } from '../frontend/src/js/utils/update'

test('detects a newer version', () => {
	expect(isVersionNewer('1.2.4', '1.2.3')).toBe(true);
	expect(isVersionNewer('v2.0.0', '1.9.9')).toBe(true);
});

test('detects an older or equal version', () => {
	expect(isVersionNewer('1.2.2', '1.2.3')).toBe(false);
	expect(isVersionNewer('1.2.3', '1.2.3')).toBe(false);
	expect(isVersionNewer('v1.2.3', '1.2.3')).toBe(false);
});

test('compares prerelease versions', () => {
	expect(isVersionNewer('1.0.0', '1.0.0-beta.1')).toBe(true);
	expect(isVersionNewer('1.0.0-beta.2', '1.0.0-beta.1')).toBe(true);
	expect(isVersionNewer('1.0.0-beta.1', '1.0.0')).toBe(false);
});
