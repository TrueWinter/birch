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
		var domSettings = document.getElementsByClassName('setting');
		settings = JSON.parse(settings);
		
		for (var setting in settings) {
			for (var i = 0; i < domSettings.length; i++) {
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
}

window.hideSettings = () => {
	document.getElementById('settings').style.display = 'none';
	document.getElementById('main').style.filter = 'unset';
}

window.changeSetting = (setting) => {
	ChangeSetting(setting);
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
		asSearch();
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

var isUserScrolling = false;
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
	var searchFor = document.getElementById('search').value;

	for (var i = 0; i < logLines.length; i++) {
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

	if (document.getElementById('as-inputs').children.length === 0) {
		addASInput();
	}
};

window.hideASSearch = () => {
	document.getElementById('advanced-search').style.display = 'none';
	document.getElementById('main').style.filter = 'unset';
};

window.clearASInputs = () => {
	document.getElementById('as-inputs').innerHTML = '';
	document.getElementById('as-search-mode').value = 'and';
	addASInput();
};

window.addASInput = () => {
	var e = document.createElement('div');
	e.innerHTML = `
	<div class="input-box">
		<input class="input as-input" type="text" autocomplete="off">
	</div>`;

	document.getElementById('as-inputs').appendChild(e);
};

window.asSearch = () => {
	advancedSearch = true;
	document.getElementById('search').placeholder = 'Using advanced search';
	var inputs = document.getElementsByClassName('as-input');
	var searchMode = document.getElementById('as-search-mode').value;

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

	document.getElementById('viewer').scrollTo(0, document.getElementById('viewer').scrollHeight);
	hideASSearch();
};

window.clearLogs = () => {
	window.logLines = [];
	window.search();
}