import { ChangeEvent, useEffect, useState } from 'react'
import { v4 as uuid } from 'uuid'
import { MantineProvider, Flex } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'

import Header from './Header'
import LogViewer from './LogViewer'
import Settings from './Settings'
import AdvancedSearch, { InputValue, searchGroupFromSavedSearch } from './AdvancedSearch'
import UpdateNotification, { Release } from './UpdateNotification'
import FileSelector from './FileSelector'
import { SavedSearch } from './SavedSearch'
import UpdateModal from './UpdateModal'

import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'

import * as app from '../../wailsjs/go/main/App'
import * as runtime from '../../wailsjs/runtime/runtime.js'
import { main } from '../../wailsjs/go/models'

export interface Log {
	id: string
	text: string
}

export interface ModalBaseProps {
	opened: boolean
	close: () => void
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
	const [loading, setLoading] = useState(true);
	const [skipLogFilter, setSkipLogFilter] = useState(false);
	const [settings, setSettings] = useState({} as BirchConfig);
	const [nonLatestFileLoaded, setNonLatestFileLoaded] = useState(false);
	const [settingsShown, { open: openSettings, close: closeSettings }] = useDisclosure(false);
	const [fileSelectorShown, { open: openFileSelector, close: closeFileSelector }] = useDisclosure(false);
	const [advancedSearchShown, { open: openAdvancedSearch, close: closeAdvancedSearch }] = useDisclosure(false);
	const [searchQuery, setSearchQuery] = useState('' as InputValue);
	const [updateModalShown, { open: openUpdateModal, close: closeUpdateModal }] = useDisclosure(false);
	const [updateInfo, setUpdateInfo] = useState(null as any as Release);

	window.logs = logs;

	function getSettings(loadDefaultSearch = false) {
		app.GetSettings().then((s) => {
			setSettings({
				MinecraftDirectory: s.MinecraftDirectory,
				IgnoreOldLogs: s.IgnoreOldLogs,
				SkipUpdateCheck: s.SkipUpdateCheck,
				DefaultSearch: s.DefaultSearch
			})

			if (loadDefaultSearch && s.DefaultSearch) {
				app.GetSavedSearches().then(searches => {
					let defaultSearch = searches.filter(e => e.name === s.DefaultSearch);
					if (defaultSearch.length != 0) {
						setSearchQuery(searchGroupFromSavedSearch(defaultSearch[0].data as SavedSearch))
					}
				})
			}
		})
	}

	function handleSettingChange(e: ChangeEvent<HTMLInputElement>) {
		switch (typeof e) {
			case 'object':
				if (!(e.target.dataset.type && e.target.dataset.setting)) return;

				switch (e.target.dataset.type) {
					case 'bool':
						app.ChangeSetting(e.target.dataset.setting, e.target.checked);
						break;
				}
				break;
			case 'string':
				app.ChangeSetting(e, '');
				break;
		}
	}

	function resetLogs(msg: Log | null) {
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
		app.LoadLog(false);
	}

	function handleSettingsChanged() {
		getSettings();
	}

	function handleMessage(d: string, allowSearch: boolean) {
		if (!allowSearch) {
			setSkipLogFilter(true);
		}

		resetLogs({
			id: uuid(),
			text: d
		});
	}

	function handleNonLatestFileLoaded() {
		setNonLatestFileLoaded(true);
		closeFileSelector();
	}

	function handleLoadStatus(status: boolean) {
		setLoading(status);
	}

	function handleLogFileSelected() {
		closeFileSelector();
		resetLogs(null);
	}

	function setDefaultSearch(name: string) {
		setSettings(s => {
			let settingsCopy = {...s};
			settingsCopy.DefaultSearch = s.DefaultSearch === name ? '' : name;
			app.ChangeSetting('DefaultSearch', settingsCopy.DefaultSearch)
			return settingsCopy
		})
	}

	useEffect(() => {
		runtime.EventsOn('log', handleLog);
		runtime.EventsOn('setLoadStatus', handleLoadStatus);
		runtime.EventsOn('changed', handleLogChange);
		runtime.EventsOn('settingsChanged', handleSettingsChanged);
		runtime.EventsOn('message', handleMessage);
		runtime.EventsOn('error', handleMessage);
		runtime.EventsOn('nonLatestFileLoaded', handleNonLatestFileLoaded);
		runtime.EventsOn('logFileSelected', handleLogFileSelected);

		app.LoadLog(false);
		getSettings(true);

		return () => {
			runtime.EventsOff(
				'log', 'setLoadStatus', 'changed', 'settingsChanged',
				'message', 'error', 'nonLatestFileLoaded', 'logFileSelected'
			);
		}
	}, [])

	useEffect(() => {
		sessionStorage.setItem('logs', JSON.stringify(logs));
	}, [logs])

	return (
		<MantineProvider forceColorScheme="dark">
			<Flex direction="column" h="100vh">
				<Header openSettings={openSettings}
					openFileSelector={openFileSelector} clearLogs={resetLogs}
					openAdvancedSearch={openAdvancedSearch} setSearchQuery={setSearchQuery}
					searchQuery={searchQuery} nonLatestFileLoaded={nonLatestFileLoaded}
				/>

				<LogViewer logs={logs} searchQuery={searchQuery} skipFilter={skipLogFilter} loading={loading} />
			</Flex>

			<Settings minecraftLocation={settings.MinecraftDirectory}
				ignoreLogs={settings.IgnoreOldLogs} skipUpdateCheck={settings.SkipUpdateCheck} 
				version={window.VERSION} opened={settingsShown} close={closeSettings}
				handleChange={handleSettingChange}
			/>

			<AdvancedSearch opened={advancedSearchShown} close={closeAdvancedSearch}
				setSearchQuery={setSearchQuery} searchQuery={searchQuery} defaultSearch={settings.DefaultSearch}
				setDefaultSearch={setDefaultSearch}
			/>

			<FileSelector opened={fileSelectorShown} close={closeFileSelector} />

			<UpdateNotification openUpdateModal={openUpdateModal} setUpdateInfo={setUpdateInfo} />
			<UpdateModal opened={updateModalShown} close={closeUpdateModal} updateInfo={updateInfo} />
		</MantineProvider>
	)
}