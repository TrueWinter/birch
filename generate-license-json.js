const DIRS = ['.', 'frontend'];
const LICENSE_FILES = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'license'];

const { promises: fs } = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const goEnvs = JSON.parse(spawnSync('go env -json', {
	shell: true,
	encoding: 'utf-8'
}).output.filter(e => e).join(''));
const GO_INSTALL_PATH = path.join(goEnvs.GOPATH, 'pkg', 'mod');

const licenses = [];
const externalLicenses = [{
	prefix: '@mantine',
	url: 'https://raw.githubusercontent.com/mantinedev/mantine/master/LICENSE'
}];
const externalLicensesCache = {};

async function exists(p) {
	try {
		await fs.stat(p);
		return true;
	} catch (_) {
		return false;
	}
}

async function getDependencies(dir) {
	if (await exists(path.join(dir, 'package.json'))) {
		/** @type {Object.<string, string>} */
		const dependencies = JSON.parse(await fs.readFile(path.join(dir, 'package.json'), {
			encoding: 'utf-8'
		})).dependencies;

		for (const dep in dependencies) {
			await getJsLicense(path.join(dir, 'node_modules'), dep);
		}
	}

	if (await exists(path.join(dir, 'go.mod'))) {
		const REQUIRE_REGEX = /require \(([^)]+)\)/gms;
		const goMod = await fs.readFile(path.join(dir, 'go.mod'), {
			encoding: 'utf-8'
		});

		const dependencies = [...goMod.matchAll(REQUIRE_REGEX)]
			// Tab and carriage returns mess up the parsing
			.map(e => e[1].replace(/\t/g, '').replace(/\r/g, ''))
			// Split by line breaks, and filter empty lines
			.join('').split('\n').filter(e => e)
			// We're only interested in dependencies directly used by Birch
			.filter(e => !e.includes('// indirect'))
			.filter(e => !e.includes('golang.org/x'));

		for (const dep of dependencies) {
			let moduleName = dep;
			if (dep.startsWith('github.com')) {
				moduleName = dep.replace(/github\.com\/[a-zA-Z0-9_-]+\//g, '');
			}
			// Turn it into the same format used by Go when it
			// stores the modules, thereby making it easier to
			// find the license files
			await getGoLicense(dep.replace(' ', '@'), moduleName);
		}
	}
}

/**
 * @param {string} moduleName Module name
 * @returns {string | null} External license
 */
function getExternalLicense(moduleName) {
	for (const e of externalLicenses) {
		if (moduleName.startsWith(e.prefix)) {
			return e.url;
		}
	}

	return null;
}

async function getExternalLicenseContent(url) {
	let content = externalLicensesCache[url] || (await fetch(url)).text();
	externalLicensesCache[url] = content;
	return content;
}

/**
 * @param {string} dir Directory
 * @param {string} module Module
 * @param {string?} origModuleName Module name
 * @returns {string}
 */
async function getJsLicense(dir, module, origModuleName = module) {
	if (module.includes('/')) {
		const moduleParts = module.split('/');
		const d = moduleParts.shift();

		return getJsLicense(path.join(dir, d), moduleParts.join('/'), origModuleName);
	}

	const modulePath = path.join(dir, module);
	const moduleFiles = await fs.readdir(modulePath);

	let licenseFile = getExternalLicense(origModuleName);
	if (!licenseFile) {
		for (const lf of LICENSE_FILES) {
			if (moduleFiles.includes(lf)) {
				licenseFile = lf;
				break;
			}
		}
	}

	if (!licenseFile) {
		console.warn(`Failed to find license for module ${origModuleName}`);
		return;
	}

	const version = require(path.join(modulePath, 'package.json')).version;

	licenses.push({
		module: `${origModuleName} v${version || '<unknown version>'}`,
		license: licenseFile.startsWith('https://') ? await getExternalLicenseContent(licenseFile) :
			await fs.readFile(path.join(modulePath, licenseFile), {
				encoding: 'utf-8'
			})
	});
}

async function getGoLicense(module, moduleName) {
	const moduleFiles = await fs.readdir(path.join(GO_INSTALL_PATH, module));

	let licenseFile = null;
	for (const lf of LICENSE_FILES) {
		if (moduleFiles.includes(lf)) {
			licenseFile = lf;
			break;
		}
	}

	if (!licenseFile) {
		console.warn(`Failed to find license for module ${module}`);
		return;
	}

	licenses.push({
		module: moduleName,
		license: await fs.readFile(path.join(GO_INSTALL_PATH, module, licenseFile), {
			encoding: 'utf-8'
		})
	});
}

(async function() {
	for await (const dir of DIRS) {
		await getDependencies(path.join(__dirname, dir));
	}

	licenses.sort((a, b) => a.module.localeCompare(b.module, 'en-UK'));
	const finalLicenses = [
		{
			module: `Birch v${require('./wails.json').info.productVersion}`,
			license: await fs.readFile(path.join(__dirname, 'LICENSE.md'), {
				encoding: 'utf-8'
			})
		},
		...licenses
	];
	fs.writeFile(path.join(__dirname, 'licenses.json'), JSON.stringify(finalLicenses), {
		encoding: 'utf-8'
	});
}());