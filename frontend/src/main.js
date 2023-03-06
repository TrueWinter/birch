import './style.css';
import './app.css';

import {
	LoadLog,
	ClearLogs,
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
runtime.EventsOn('log', (d) => {
	// Some log lines have multiple lines, so this is needed to split them properly
	logLines = d.split('\n[');

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
	var searchFor = document.getElementById('search').value;
	var output = [];

	for (var i = 0; i < logLines.length; i++) {
		if (logLines[i].toLowerCase().includes(searchFor.toLowerCase())) {
			output.push(bracketFix(logLines[i]));
		}
	}

	document.getElementById('viewer').innerText = output.join('\n');

	if (!isUserScrolling) {
		document.getElementById('viewer').scrollTo(0, document.getElementById('viewer').scrollHeight);
	}
};

window.showASSearch = () => {
	document.getElementById('advanced-search').style.display = 'unset';
	document.getElementById('main').style.filter = 'blur(5px)';

	clearASInputs();
	addASInput();
};

window.hideASSearch = () => {
	document.getElementById('advanced-search').style.display = 'none';
	document.getElementById('main').style.filter = 'unset';
}
;
window.clearASInputs = () => {
	document.getElementById('as-inputs').innerHTML = '';
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
	var inputs = document.getElementsByClassName('as-input');
	var searchMode = document.getElementById('as-search-mode').value;

	var output = [];

	for (var i = 0; i < logLines.length; i++) {
		switch (searchMode) {
			case 'and':
				var trueSearchNum = 0;
				for (let j = 0; j < inputs.length; j++) {
					if (logLines[i].toLowerCase().includes(inputs[j].value.toLowerCase())) {
						trueSearchNum++;
					}
				}

				if (trueSearchNum === inputs.length) {
					output.push(bracketFix(logLines[i]));
				}
				break;
			case 'or':
				for (let j = 0; j < inputs.length; j++) {
					if (logLines[i].toLowerCase().includes(inputs[j].value.toLowerCase())) {
						output.push(bracketFix(logLines[i]));
					}
				}
				break;
			default:
				return;
		}
	}

	document.getElementById('viewer').innerText = output.join('\n');
	document.getElementById('viewer').scrollTo(0, document.getElementById('viewer').scrollHeight);
	hideASSearch();
};

window.clearLogs = () => {
	ClearLogs();
}

// Notes for future advanced search option
/**
 * // Must have "spy" and either "TrueWinter" or "[CONSOLE]"
 * {
 *		"search": "spy",
 *		"and": {
 * 			"search": "TrueWinter",
 * 			"or": {
 * 				"search": "[CONSOLE]"
 * 			}
 * 		}
 * }
 */

/**
 * // Must have "spy" and "TrueWinter" and "shepherd"
 * // and either "post office" or "postbox"
 * {
 * 		"search": "spy",
 * 		"and": {
 * 			"search": "TrueWinter",
 * 			"and": {
 * 				"search": "shepherd",
 * 				"and": {
 * 					"search": "post office",
 * 					"or": {
 * 						"search": "postbox"
 * 					}
 * 				}
 * 			}
 * 		}
 * }
 */

/**
 * // Will match either "socialspy" or "localspy"
 * // (but only if the message containing "localspy"
 * // also contains "how do i create a shop")
 * {
 * 		"search": "socialspy",
 * 		"or": {
 * 			"search" : "localspy",
 * 			"and": {
 * 				"search": "how do i make a shop"
 * 			}
 * 		}
 * }
 */

/**
 * // Match either:
 * // - "socialspy" and "xray"
 * // - "localspy" and "diamonds"
 * {
 * 		"search": "socialspy",
 * 		"and": {
 * 			"search": "xray"
 * 		},
 *  	"or": {
 * 			"search": "localspy",
 * 			"and": {
 * 				"search": "diamonds"
 * 			}
 * 		}
 * }
 */