import React, { ChangeEvent, useEffect, useState } from 'react';
import { v4 as uuid } from 'uuid'

import Header from './Header'
import LogViewer from './LogViewer'
import Overlay from './Overlay'
import Settings from './Settings'
import AdvancedSearch, { SearchQuery, SearchQueryWithTerms } from './AdvancedSearch'
import UpdateNotification from './UpdateNotification'

import '../style.css'
import '../app.css'

import * as app from '../../wailsjs/go/main/App'
import * as runtime from '../../wailsjs/runtime/runtime.js'
import { main } from '../../wailsjs/go/models';

export interface Log {
	id: string
	text: string
}

// https://stackoverflow.com/a/54178819
// SavedSearchQueries isn't needed in the state, so make it optional there
type BirchConfig = Omit<main.BirchConfig, 'SavedSearchQueries'> & Partial<Pick<main.BirchConfig, 'SavedSearchQueries'>>

function bracketFix(str: string) {
	// See log event for reason
	return str.startsWith('[') || str.length == 0 ?
	str : `[${str}`
}

export default function App() {
	const [logs, setLogs] = useState((JSON.parse(sessionStorage.getItem('logs') as string) || []) as Log[]);
	const [skipLogFilter, setSkipLogFilter] = useState(false);
	const [settings, setSettings] = useState({} as BirchConfig);
	const [settingsShown, setSettingsShown] = useState(false);
	const [headerHeight, setHeaderHeight] = useState(0);
	const [advancedSearchShown, setAdvancedSearchShown] = useState(false);
	const [searchQuery, setSearchQuery] = useState('' as string | SearchQueryWithTerms);

	window.logs = logs;

	function getSettings() {
		app.GetSettings().then((s) => {
			setSettings({
				MinecraftDirectory: s.MinecraftDirectory,
				IgnoreOldLogs: s.IgnoreOldLogs,
				SkipUpdateCheck: s.SkipUpdateCheck
			});
		});
	}

	function handleSettingChange(e: ChangeEvent<HTMLInputElement>) {
		console.log(e, typeof e);
		switch (typeof e) {
			case 'object':
				if (!(e.target.dataset.type && e.target.dataset.setting)) return;

				switch (e.target.dataset.type) {
					case 'bool':
						app.BoolSettingChanged(e.target.dataset.setting, e.target.checked);
						break;
				}
				break;
			case 'string':
				app.ChangeSetting(e, undefined as any);
				break;
		}
	}

	function resetLogs(msg: Log) {
		setLogs(msg ? [msg] : []);
		sessionStorage.setItem('logs', '[]');
	}

	function handleLog(d: string) {
		if (!d.trim()) return;

		const newLogs = [] as Log[];

		// Some log lines have multiple lines, so this is needed to split them properly
		d.split('\n[').forEach(text => {
			newLogs.push({
				id: uuid(),
				text: bracketFix(text)
			});
		});

		setLogs(prevLogs => ([ ...prevLogs, ...newLogs ]));
	}

	function handleLogChange() {
		app.LoadLog();
	}

	function handleSettingsChanged() {
		getSettings();
	}

	function handleMessage(d: string) {
		setSkipLogFilter(true);
		resetLogs({
			id: uuid(),
			text: d
		});
	}

	useEffect(() => {
		runtime.EventsOn('log', handleLog);
		runtime.EventsOn('changed', handleLogChange);
		runtime.EventsOn('settingsChanged', handleSettingsChanged);
		runtime.EventsOn('message', handleMessage);
		runtime.EventsOn('error', handleMessage);

		app.LoadLog();
		getSettings();

		return () => {
			runtime.EventsOff(
				'log', 'changed', 'settingsChanged',
				'message', 'error'
			);
		}
	}, [])

	useEffect(() => {
		sessionStorage.setItem('logs', JSON.stringify(logs));
	}, [logs])

	return (
		<>
			<Overlay id="main" shown={settingsShown || advancedSearchShown} />
			<Header showSettings={() => setSettingsShown(true)}
				setHeaderHeight={setHeaderHeight} clearLogs={resetLogs}
				setAdvancedSearchShown={setAdvancedSearchShown} setSearchQuery={setSearchQuery}
				searchQuery={searchQuery}
			/>
			<div className="sep"></div>
			<LogViewer logs={logs} headerHeight={headerHeight} searchQuery={searchQuery} skipFilter={skipLogFilter} />

			{settingsShown && <Settings minecraftLocation={settings.MinecraftDirectory}
				ignoreLogs={settings.IgnoreOldLogs} skipUpdateCheck={settings.SkipUpdateCheck} 
				version={window.VERSION} hideSettings={() => setSettingsShown(false)}
				handleChange={handleSettingChange}
			/>}

			{advancedSearchShown && <AdvancedSearch setAdvancedSearchShown={setAdvancedSearchShown}
				setSearchQuery={setSearchQuery} searchQuery={searchQuery}
			/>}

			<UpdateNotification />
		</>
	)
}