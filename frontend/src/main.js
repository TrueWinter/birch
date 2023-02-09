import './style.css';
import './app.css';

import {
	LoadLog,
	GetSettings,
	ChangeSetting
} from '../wailsjs/go/main/App';

window.logLines = [];

function handleResize() {
	document.getElementById('viewer').style.height = `${window.innerHeight - document.getElementsByClassName('search')[0].clientHeight - 1 - 20}px`;
	document.getElementById('viewer').scrollTo(0, document.getElementById('viewer').scrollHeight);
}

window.addEventListener('load', () => {
	handleResize();
	LoadLog();

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
});

function updateDomSettings() {
	GetSettings().then((settings) => {
		var domSettings = document.getElementsByClassName('setting');
		settings = JSON.parse(settings);
		
		for (var setting in settings) {
			for (var i = 0; i < domSettings.length; i++) {
				if (domSettings[i].dataset.setting === setting) {
					domSettings[i].innerText = settings[setting];
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

window.search = () => {
	advancedSearch = false;
	var searchFor = document.getElementById('search').value;
	var output = [];

	for (var i = 0; i < logLines.length; i++) {
		if (logLines[i].toLowerCase().includes(searchFor.toLowerCase())) {
			output.push(
				// See log event for reason
				logLines[i].startsWith('[') ?
				logLines[i] : `[${logLines[i]}`
			);
		}
	}

	document.getElementById('viewer').innerText = output.join('\n');
	document.getElementById('viewer').scrollTo(0, document.getElementById('viewer').scrollHeight);
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
					output.push(
						// See log event for reason
						logLines[i].startsWith('[') ?
						logLines[i] : `[${logLines[i]}`
					);
				}
				break;
			case 'or':
				for (let j = 0; j < inputs.length; j++) {
					if (logLines[i].toLowerCase().includes(inputs[j].value.toLowerCase())) {
						output.push(
							// See log event for reason
							logLines[i].startsWith('[') ?
							logLines[i] : `[${logLines[i]}`
						);
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