import Markdown from 'react-markdown'
import { useState } from 'react'
import { ModalBaseProps } from './App'
import { Modal, Button, TypographyStylesProvider, Text, Stack } from '@mantine/core'

import { Release } from './UpdateNotification'
import { DownloadUpdate, InstallUpdate } from '../../wailsjs/go/main/App'

interface UpdatePopupProps extends ModalBaseProps {
	updateInfo: Release
}

export default function UpdateModal({
	opened,
	close,
	updateInfo
}: UpdatePopupProps) {
	const [downloading, setDownloading] = useState(false);
	const [status, setStatus] = useState('');

	function update() {
		setDownloading(true);
		setStatus('Downloading...');

		DownloadUpdate(updateInfo.assets).then(file => {
			if (!file) return;
			setStatus('Installing...');

			InstallUpdate(file).catch(err => {
				alert(`An error occurred while installing: ${err}`);
				setDownloading(false);
				setStatus('');
			});
		}).catch(err => {
			alert(`An error occurred while downloading: ${err}`);
			setDownloading(false);
			setStatus('');
		});
	}
	
	return (
		<Modal opened={opened} onClose={close} title="Install Update" centered>
			{opened && <Stack gap="12px">
				<TypographyStylesProvider style={{
					borderBottom: '1px solid grey',
					paddingBottom: '6px'
				}}>
					<Markdown skipHtml>{updateInfo.body}</Markdown>
				</TypographyStylesProvider>
				<div>
					<Button onClick={() => update()} disabled={downloading}>
						{status ? status : 'Download and Install'}
					</Button>
				</div>
				<Text size="sm">Birch will close after downloading the update to allow the installer to install the update.</Text>
			</Stack>}
		</Modal>
	)
}