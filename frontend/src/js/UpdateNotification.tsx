import { useEffect, useState } from 'react'
import { main } from '../../wailsjs/go/models'
import { Anchor, Notification } from '@mantine/core'
import { CheckForUpdates } from '../../wailsjs/go/main/App'
import * as runtime from '../../wailsjs/runtime/runtime.js'

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

	function openUrl() {
		openUpdateModal();
		setShow(false);
	}

	useEffect(() => {
		runtime.EventsOn('updateAvailable', (release: Release) => {
			setUpdateInfo(release);
			setShow(true);
		});

		CheckForUpdates().catch(err => {
			console.error('Failed to check for updates', err);
		});

		return () => {
			runtime.EventsOff('updateAvailable');
		}
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
