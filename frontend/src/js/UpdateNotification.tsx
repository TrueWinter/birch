import { useEffect, useState } from 'react'
import semver from 'semver'
import CloseButton from './CloseButton'

import css from '../css/UpdateNotification.module.css'

import { BrowserOpenURL } from '../../wailsjs/runtime/runtime'

export default function UpdateNotification() {
	const [show, setShow] = useState(false);
	const [updateUrl, setUpdateUrl] = useState('');

	function isVersionNewer(newVersion: string, oldVersion: string) {
		newVersion = newVersion.replace(/^v/, '');
		oldVersion = oldVersion.replace(/^v/, '');

		return semver.gt(newVersion, oldVersion);
	}

	async function updateCheck() {
		let resp = await fetch('https://api.github.com/repos/TrueWinter/Birch/releases/latest');
		if (resp.status !== 200) return;
		let release = await resp.json();

		if (isVersionNewer(release.tag_name, `v${window.VERSION}`)) {
			setUpdateUrl(release.html_url);
			setShow(true);
		}
	}

	function openUrl() {
		BrowserOpenURL(updateUrl);
	}

	useEffect(() => {
		updateCheck();
	}, []);

	return (
		<>
			{show &&
				<div className={css.notification}>
					<CloseButton onClick={() => setShow(false)} />
					<div>An update is available. <a href="#" onClick={openUrl}>Click here to download it.</a></div>
				</div>
			}
		</>
	)
}