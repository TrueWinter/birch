import semver from 'semver'

export function isVersionNewer(newVersion: string, oldVersion: string) {
	newVersion = newVersion.replace(/^v/, '');
	oldVersion = oldVersion.replace(/^v/, '');

	return semver.gt(newVersion, oldVersion);
}
