import { useEffect, useState } from 'react'
import semver from 'semver'
import { main } from '../../wailsjs/go/models'
import { Anchor, Notification } from '@mantine/core'

// Only the fields we care about
export interface Release {
	assets: main.GithubAsset[]
	tag_name: string
	html_url: string
	body: string
}

interface UpdateNotificationProps {
	openUpdateModal: () => void
	setUpdateInfo: React.Dispatch<React.SetStateAction<Release>>
}

export default function UpdateNotification({
	openUpdateModal,
	setUpdateInfo
}: UpdateNotificationProps) {
	const [show, setShow] = useState(false);

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
			setUpdateInfo(release);
			setShow(true);
		}
	}

	function openUrl() {
		openUpdateModal();
		setShow(false);
	}

	useEffect(() => {
		updateCheck();
	}, []);

	return (
		<>
			{show &&
				<Notification style={{
					position: 'fixed',
					bottom: '12px',
					right: '24px'
				}} onClose={() => setShow(false)}>
					<div>An update is available. <Anchor href="#" onClick={openUrl}>Click here to download it.</Anchor></div>
				</Notification>
			}
		</>
	)
}