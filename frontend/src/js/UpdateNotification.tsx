import { useEffect, useState } from 'react'
import semver from 'semver'
import CloseButton from './CloseButton'
import { main } from '../../wailsjs/go/models'

import css from '../css/UpdateNotification.module.css'


// Only the fields we care about
export interface Release {
	assets: main.GithubAsset[]
	tag_name: string
	html_url: string
	body: string
}

interface UpdateNotificationProps {
	setUpdatePopupShown: React.Dispatch<React.SetStateAction<boolean>>
	setUpdateInfo: React.Dispatch<React.SetStateAction<Release>>
}

export default function UpdateNotification({
	setUpdatePopupShown,
	setUpdateInfo
}: UpdateNotificationProps) {
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
		let release: Release = await resp.json();

		if (isVersionNewer(release.tag_name, `v${window.VERSION}`)) {
			setUpdateUrl(release.html_url);
			setUpdateInfo(release);
			setShow(true);
		}
	}

	function openUrl() {
		setUpdatePopupShown(true);
		setShow(false);
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