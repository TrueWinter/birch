import './style.css';
import './app.css';

import {
	LoadLog,
	GetSettings,
	ChangeSetting,
	BoolSettingChanged
} from '../wailsjs/go/main/App';

import wailsConfig from '../../wails.json';
window.VERSION = wailsConfig.info.productVersion;

window.logLines = [];

function handleResize() {
	document.getElementById('viewer').style.height = `${window.innerHeight - document.getElementsByClassName('search')[0].clientHeight - 1 - 20}px`;
	document.getElementById('viewer').scrollTo(0, document.getElementById('viewer').scrollHeight);
}

window.addEventListener('load', () => {
	handleResize();
	LoadLog();

	document.getElementById('settings-version').innerText = `v${VERSION}`;

	document.getElementById('search').addEventListener('keyup', (e) => {
		e.preventDefault();
		if (e.key === 'Enter') {
			search();
		}
	});

	document.getElementById('settingsBtn').addEventListener('click', () => {
		showSettings();
	});

	updateDomSettings();

	[...document.getElementsByClassName('setting')].forEach((s) => {
		if (s.localName === 'input') {
			s.addEventListener('change', (e) => {
				switch (e.target.type) {
					case 'checkbox':
						BoolSettingChanged(
							e.target.dataset.setting,
							e.target.checked ?? false
						);
						break;
				}
				
			});
		}
	});
});

function updateDomSettings() {
	GetSettings().then((settings) => {
		let domSettings = document.getElementsByClassName('setting');
		window.settings = JSON.parse(settings);
		
		for (let setting in settings) {
			for (let i = 0; i < domSettings.length; i++) {
				if (domSettings[i].dataset.setting === setting) {
					switch (domSettings[i].dataset.type) {
						case 'text':
							domSettings[i].innerText = settings[setting];
							break
						case 'bool':
							domSettings[i].checked = settings[setting];
							break;
					}
				}
			}
		}
	});
}

window.addEventListener('resize', () => {
	handleResize();
});

window.showSettings = () => {
	document.getElementById('settings').style.display = 'unset';
	document.getElementById('main').style.filter = 'blur(5px)';
	showOverlay();
}

window.hideSettings = () => {
	document.getElementById('settings').style.display = 'none';
	document.getElementById('main').style.filter = 'unset';
	hideOverlay();
}

window.changeSetting = (setting, value) => {
	console.log('set', setting, value);
	ChangeSetting(setting, value);
}

runtime.EventsOn('changed', () => {
	LoadLog();
});

runtime.EventsOn('settingsChanged', () => {
	updateDomSettings();
});

window.openUrl = (url) => {
	runtime.BrowserOpenURL(url);
}

window.updateCheck = async () => {
	let resp = await fetch('https://api.github.com/repos/TrueWinter/Birch/releases/latest');
	if (resp.status !== 200) return;
	let release = await resp.json();

	if (release.tag_name > `v${window.VERSION}`) {
		let link = document.createElement('a');
		link.href = 'javascript:void(0)';
		link.setAttribute('onclick', `openUrl('${release.html_url}')`);
		link.innerText = 'Click here to download it.';
		document.getElementById('update-notification-text').innerHTML = `An update is available. ${link.outerHTML}`;
		document.getElementById('update-notification').style.display = 'block';
	}
};

window.hideUpdateNotification = () => {
	document.getElementById('update-notification').style.display = 'none';
};

runtime.EventsOn('updateCheck', () => {
	updateCheck();
});

window.advancedSearch = false;
let logId = 0;
runtime.EventsOn('log', (d) => {
	if (!d.trim()) return;

	// Some log lines have multiple lines, so this is needed to split them properly
	let v = document.getElementById('viewer');
	d.split('\n[').forEach(text => {
		const id = ++logId;
		let elem = document.createElement('div');
		elem.classList.add('log-line');
		elem.dataset.logId = id;
		elem.innerText = bracketFix(text);
		logLines.push({
			id,
			text: bracketFix(text)
		});
		v.appendChild(elem);
	});

	if (advancedSearch) {
		asSearch(false);
	} else {
		search();
	}
});

runtime.EventsOn('message', (d) => {
	document.getElementById('viewer').innerText = d;
});

runtime.EventsOn('error', (d) => {
	document.getElementById('viewer').innerText = d;
});

function bracketFix(str) {
	// See log event for reason
	return str.startsWith('[') || str.length == 0 ?
	str : `[${str}`
}

let isUserScrolling = false;
document.getElementById('viewer').addEventListener('scroll', () => {
	isUserScrolling = true;

	if (document.getElementById('viewer').scrollHeight ===
		document.getElementById('viewer').scrollTop +
		document.getElementById('viewer').clientHeight) {
			isUserScrolling = false;
		}
});

window.search = () => {
	advancedSearch = false;
	document.getElementById('search').placeholder = '';
	let searchFor = document.getElementById('search').value;

	for (let i = 0; i < logLines.length; i++) {
		let elem = document.querySelector(`.log-line[data-log-id="${logLines[i].id}"]`);
		if (logLines[i].text.toLowerCase().includes(searchFor.toLowerCase())) {
			elem.style.display = 'block';
		} else {
			elem.style.display = 'none';
		}
	}

	if (!isUserScrolling) {
		document.getElementById('viewer').scrollTo(0, document.getElementById('viewer').scrollHeight);
	}
};

window.showASSearch = () => {
	document.getElementById('advanced-search').style.display = 'unset';
	document.getElementById('main').style.filter = 'blur(5px)';
	showOverlay();

	if (document.getElementById('as-inputs').children.length === 0) {
		addASInput();
	}
};

window.hideASSearch = () => {
	document.getElementById('advanced-search').style.display = 'none';
	document.getElementById('main').style.filter = 'unset';
	hideOverlay();
};

window.clearASInputs = (add=true) => {
	document.getElementById('as-inputs').innerHTML = '';
	document.getElementById('as-search-mode').value = 'and';
	if (add) {
		addASInput();
	}
	search();
};

window.addASInput = (value='') => {
	let e = document.createElement('div');
	e.innerHTML = `
	<div class="input-box">
		<input class="input as-input" type="text" autocomplete="off" value="${value}">
	</div>`;

	document.getElementById('as-inputs').appendChild(e);
};

window.asSearch = (hide=true) => {
	advancedSearch = true;
	document.getElementById('search').placeholder = 'Using advanced search';
	let inputs = document.getElementsByClassName('as-input');
	let searchMode = document.getElementById('as-search-mode').value;

	for (let i = 0; i < logLines.length; i++) {
		let elem = document.querySelector(`.log-line[data-log-id="${logLines[i].id}"]`);
		console.log('asSearch', searchMode, elem);
		switch (searchMode) {
			case 'and':
				let matchesForAndSearch = 0;
				for (let j = 0; j < inputs.length; j++) {
					if (logLines[i].text.toLowerCase().includes(inputs[j].value.toLowerCase())) {
						matchesForAndSearch++;
					}
				}

				// If this log line matches all searched terms, show it
				if (matchesForAndSearch === inputs.length) {
					elem.style.display = 'block';
				} else {
					elem.style.display = 'none';
				}
				break;
			case 'or':
				let matchesForOrSearch = 0;
				for (let j = 0; j < inputs.length; j++) {
					if (logLines[i].text.toLowerCase().includes(inputs[j].value.toLowerCase())) {
						matchesForOrSearch++;
					}
				}

				// If this log line matches any searched terms, show it
				if (matchesForOrSearch > 0) {
					elem.style.display = 'block';
				} else {
					elem.style.display = 'none';
				}
				break;
			default:
				return;
		}
	}

	if (!isUserScrolling) {
		document.getElementById('viewer').scrollTo(0, document.getElementById('viewer').scrollHeight);
	}

	if (hide) {
		hideASSearch();
	}
};

window.showSaveSearch = () => {
	if (getSearchQueryToSave().inputs.length === 0) {
		return alert('Cannot save blank search query');
	}

	document.getElementById('save-search').style.display = 'unset';
	document.getElementById('advanced-search').style.filter = 'blur(5px)';
	showOverlay('search');
};

window.hideSaveSearch = () => {
	document.getElementById('save-search').style.display = 'none';
	document.getElementById('advanced-search').style.filter = 'unset';
	document.getElementById('save-search-name').value = '';
	document.getElementById('save-search-btn').removeAttribute('disabled');
	hideOverlay('search');
};

runtime.EventsOn('savedSearchQueries', () => {
	hideSaveSearch();
	hideLoadSavedSearch();
	updateDomSettings();
});

window.getSearchQueryToSave = () => {
	let s = {
		mode: document.getElementById('as-search-mode').value,
		inputs: [...document.getElementsByClassName('as-input')].map(e => e.value).filter(e => e)
	};

	return s;
};

window.saveSearchQuery = () => {
	let name = document.getElementById('save-search-name').value;
	if (!name || !name.trim()) {
		return alert('Cannot save search query with blank name');
	}

	document.getElementById('save-search-btn').setAttribute('disabled', 'true');

	changeSetting('SavedSearchQueries', {
		key: name,
		value: btoa(JSON.stringify(getSearchQueryToSave()))
	});
};

window.loadSavedSearch = (e) => {
	clearASInputs(false);

	let data = JSON.parse(atob(e.parentElement.dataset.data));

	document.getElementById('as-search-mode').value = data.mode;

	for (let search of data.inputs) {
		addASInput(search);
	}

	hideLoadSavedSearch();
};

window.deleteSavedSearch = (e) => {
	let name = e.parentElement.dataset.name;
	changeSetting('SavedSearchQueries', {
		key: name,
		value: null
	});
};

function createLoadSavedSearchElem(name, data) {
	let d = document.createElement('div');
	d.className = 'input-box saved-search-container'
	d.style.marginBottom = '8px';
	d.dataset.name = name;
	d.dataset.data = data;

	let s = document.createElement('span');
	s.className = 'saved-search-text';
	s.innerText = name;

	let b = document.createElement('button');
	b.className = 'input saved-search-button';
	b.style.cursor = 'pointer';
	b.style.marginLeft = '8px';
	b.setAttribute('onclick', 'loadSavedSearch(this)');
	b.innerText = 'Load';

	let b2 = document.createElement('button');
	b2.className = 'input saved-search-button';
	b2.style.cursor = 'pointer';
	b2.style.backgroundColor = 'coral';
	b2.style.marginLeft = '8px';
	b2.setAttribute('onclick', 'deleteSavedSearch(this)');
	b2.innerText = 'Delete';

	d.appendChild(s);
	d.appendChild(b);
	d.appendChild(b2);

	return d;
}

window.showLoadSavedSearch = () => {
	document.getElementById('load-saved-search').style.display = 'unset';
	document.getElementById('advanced-search').style.filter = 'blur(5px)';
	showOverlay('search');

	let searches = document.getElementById('saved-searches');
	searches.innerHTML = '';
	let saved = settings.SavedSearchQueries || {};

	if (Object.keys(saved).length === 0) {
		searches.innerText = 'No saved search queries';
		return;
	}

	for (let search in saved) {
		searches.appendChild(createLoadSavedSearchElem(search, saved[search]));
	}
};

window.hideLoadSavedSearch = () => {
	document.getElementById('load-saved-search').style.display = 'none';
	document.getElementById('advanced-search').style.filter = 'unset';
	hideOverlay('search');
};

window.clearLogs = () => {
	window.logLines = [];
	document.getElementById('viewer').innerHTML = '';
	window.search();
};

window.showOverlay = (id='main') => {
	let ov = document.querySelector(`.overlay[data-overlay-id="${id}"`);
	ov.style.display = 'block';
	ov.style.zIndex = parseInt(window.getComputedStyle(ov.parentElement).zIndex || 0) + 50;
};

window.hideOverlay = (id='main') => {
	document.querySelector(`.overlay[data-overlay-id="${id}"`).style.display = 'none';
};