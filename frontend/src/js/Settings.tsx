import CloseButton from './CloseButton'
import css from '../css/Settings.module.css'
import { ChangeEventHandler } from 'react'

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
	return (
		<div className={css.settings}>
			<CloseButton onClick={hideSettings} />
			<h1>Settings</h1>
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
			}}><span style={{color: 'bisque'}}>Birch</span>, developed by TrueWinter</div>
			<div id="settings-version" style={{display: 'inline', float: 'right'}}>v{version}</div>
		</div>
	)
}