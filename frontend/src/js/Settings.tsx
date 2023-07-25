import { ChangeEventHandler, useState } from 'react'

import CloseButton from './CloseButton'
import Overlay from './Overlay'
import Licenses from './Licenses'

import { BrowserOpenURL } from '../../wailsjs/runtime/runtime'

import css from '../css/Settings.module.css'
import commonCss from '../css/_common.module.css'

interface SettingsProps {
 	minecraftLocation: string
 	ignoreLogs: boolean
 	skipUpdateCheck: boolean
	version: string
 	hideSettings: Function
 	handleChange: Function
}

export default function Settings({
	minecraftLocation, ignoreLogs,
	skipUpdateCheck, version,
	hideSettings, handleChange
}: SettingsProps) {
	const [licensesShown, setLicensesShown] = useState(false);

	return (
		<div className={css.settings}>
			<Overlay id="settings" shown={licensesShown} />
			{licensesShown && <Licenses setLicensesShown={setLicensesShown} />}
			<h1 className={commonCss.headingWithButton}>Settings
				<CloseButton onClick={hideSettings} />
			</h1>
			<p>You will need to restart Birch for changes to apply</p>
			<div>
				<div className="setting-container">
					<b>Minecraft Location: </b>
					<span className="current-setting">
						<span className="setting" data-setting="MinecraftDirectory" data-type="text">{minecraftLocation} </span>
					</span>
					<span className="change-setting">
						<button onClick={() => handleChange('MinecraftDirectory')}>Change</button>
					</span>
				</div>
				<div className="setting-container">
					<b>Ignore logs from before Birch was opened:</b>
					<span className="current-setting">
						<input type="checkbox" className="setting" data-setting="IgnoreOldLogs" data-type="bool" onChange={handleChange as ChangeEventHandler} defaultChecked={ignoreLogs || false} />
					</span>
				</div>
				<div className="setting-container">
					<b>Skip update check on startup:</b>
					<span className="current-setting">
						<input type="checkbox" className="setting" data-setting="SkipUpdateCheck" data-type="bool" onChange={handleChange as ChangeEventHandler} defaultChecked={skipUpdateCheck || false} />
					</span>
				</div>
			</div>
			<hr />
			<div style={{
				display: 'inline',
				float: 'left'
			}}><a href="#" style={{
				color: 'bisque',
				cursor: 'pointer'
			}} onClick={() => BrowserOpenURL('https://github.com/TrueWinter/birch')}>Birch</a>, developed by TrueWinter</div>
			<div id="settings-version" style={{display: 'inline', float: 'right'}}>v{version}</div>
			<br />
			<div className={css.licenseText}>
				<a href="#" onClick={() => setLicensesShown(true)}>View open-source licenses</a>
			</div>
		</div>
	)
}