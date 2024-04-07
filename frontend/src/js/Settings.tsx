import { ChangeEventHandler, useState } from 'react'
import Licenses from './Licenses'
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime'

import { Modal, TextInput, Checkbox, Flex, Anchor, Center } from '@mantine/core'
import css from '../css/Settings.module.css'
import { ModalBaseProps } from './App'
import { useDisclosure } from '@mantine/hooks'

interface SettingsProps extends ModalBaseProps {
 	minecraftLocation: string
 	ignoreLogs: boolean
 	skipUpdateCheck: boolean
	version: string
 	handleChange: Function
}

export default function Settings({
	minecraftLocation, ignoreLogs,
	skipUpdateCheck, version,
	handleChange, opened, close
}: SettingsProps) {
	const [licensesShown, { open: openLicenses, close: closeLicenses}] = useDisclosure(false);

	return (
		<Modal opened={opened} onClose={close} centered title="Settings">
			<Licenses opened={licensesShown} close={closeLicenses} />
			<div style={{
				marginBottom: '8px'
			}}>You will need to restart Birch for changes to apply</div>
			<Flex rowGap={8} direction="column">
				<TextInput label="Minecraft Location" data-setting="MinecraftDirectory" value={minecraftLocation} readOnly classNames={{
					input: css.selectFolder
				}} onClick={() => handleChange('MinecraftDirectory')} />
				<Checkbox label="Ignore logs from before Birch was opened" defaultChecked={ignoreLogs || false} data-setting="IgnoreOldLogs" data-type="bool" onChange={handleChange as ChangeEventHandler} />
				<Checkbox label="Skip update check on startup" defaultChecked={skipUpdateCheck || false} data-setting="SkipUpdateCheck" data-type="bool" onChange={handleChange as ChangeEventHandler} />
			</Flex>

			<hr />

			<Flex justify="space-between">
				<div><Anchor href="#" onClick={() => BrowserOpenURL('https://github.com/TrueWinter/birch')}>Birch</Anchor>, developed by TrueWinter</div>
				<div id="settings-version">v{version}</div>
			</Flex>

			<Center>
				<Anchor size="sm" href="#" onClick={() => openLicenses()}>View open-source licenses</Anchor>
			</Center>
		</Modal>
	)
}