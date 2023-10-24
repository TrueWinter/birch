import Markdown from 'react-markdown'
import { useState } from 'react'

import CloseButton from './CloseButton'
import { Release } from './UpdateNotification'
import { DownloadUpdate, InstallUpdate } from '../../wailsjs/go/main/App'

interface UpdatePopupProps {
	setUpdatePopupShown: React.Dispatch<React.SetStateAction<boolean>>
	updateInfo: Release
}

import css from '../css/UpdatePopup.module.css'
import commonCss from '../css/_common.module.css'

export default function UpdatePopup({
	setUpdatePopupShown,
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
		<div className={commonCss.popup}>
			<h1 className={commonCss.headingWithButton}>Install Update
				{!downloading && <CloseButton onClick={() => setUpdatePopupShown(false)}/>}
			</h1>
			<hr/>
			<Markdown>{updateInfo.body}</Markdown>
			<hr/>
			<div className={['input-box', css.buttonContainer].join(' ')}>
				<button type="button" className="input" onClick={() => update()} disabled={downloading}>
					{status ? status : 'Download and Install'}
				</button>
			</div>
			<small className={css.notice}>Birch will close after downloading the update to allow the installer to install the update.</small>
		</div>
	)
}