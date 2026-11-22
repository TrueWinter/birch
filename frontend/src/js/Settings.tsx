import { ChangeEventHandler, useEffect, useState } from 'react'
import Licenses from './Licenses'
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime'
import { AddInstance, GetSavedSearches, RemoveInstance, SetInstanceDefaultSearch, SetInstanceDirectory, SetInstanceName } from '../../wailsjs/go/main/App'
import { main } from '../../wailsjs/go/models'

import { Modal, TextInput, Checkbox, Flex, Anchor, Center, Button, Select, Text, Badge } from '@mantine/core'
import css from '../css/Settings.module.css'
import { ModalBaseProps } from './App'
import { useDisclosure } from '@mantine/hooks'

interface SettingsProps extends ModalBaseProps {
	instances: main.Instance[]
	activeInstance: string
	ignoreLogs: boolean
	skipUpdateCheck: boolean
	version: string
	handleChange: Function
	refreshSettings: Function
}

function handleError(err: any) {
	const message = `${err}`;
	if (message.toLowerCase().includes('no folder selected')) {
		return;
	}

	alert(`An error occurred: ${message}`);
}

function baseName(path: string) {
	const parts = path.split(/[\\/]/).filter(Boolean);
	return parts.length ? parts[parts.length - 1] : path;
}

function InstanceNameField({ id, name, directory, onCommit }: { id: string, name: string, directory: string, onCommit: (id: string, name: string) => void }) {
	const [value, setValue] = useState(name);

	useEffect(() => {
		setValue(name);
	}, [name]);

	function commit() {
		const trimmed = value.trim();
		setValue(trimmed === '' ? baseName(directory) : trimmed);
		onCommit(id, value);
	}

	return (
		<TextInput label="Name" value={value}
			onChange={(e) => setValue(e.currentTarget.value)}
			onBlur={commit} />
	);
}

export default function Settings({
	instances, activeInstance, ignoreLogs,
	skipUpdateCheck, version,
	handleChange, refreshSettings, opened, close
}: SettingsProps) {
	const [licensesShown, { open: openLicenses, close: closeLicenses}] = useDisclosure(false);
	const [savedSearches, setSavedSearches] = useState([] as string[]);

	useEffect(() => {
		if (!opened) return;

		GetSavedSearches().then(searches => {
			setSavedSearches(searches.map(e => e.name));
		}).catch(err => {
			alert(`An error occurred: ${err}`);
		});
	}, [opened]);

	function addInstance() {
		AddInstance().then(() => refreshSettings()).catch(handleError);
	}

	function removeInstance(id: string, name: string) {
		if (!confirm(`Remove the instance "${name}"?`)) return;

		RemoveInstance(id).then(() => refreshSettings()).catch(handleError);
	}

	function setName(id: string, name: string) {
		SetInstanceName(id, name).then(() => refreshSettings()).catch(handleError);
	}

	function setDirectory(id: string) {
		SetInstanceDirectory(id).then(() => refreshSettings()).catch(handleError);
	}

	function setDefaultSearch(id: string, name: string) {
		SetInstanceDefaultSearch(id, name).then(() => refreshSettings()).catch(handleError);
	}

	return (
		<Modal opened={opened} onClose={close} centered title="Settings" size="lg">
			<Licenses opened={licensesShown} close={closeLicenses} />
			<div style={{
				marginBottom: '8px'
			}}>Minecraft instance changes take effect immediately. Other settings may require a restart.</div>

			<Text fw={600} mb={4}>Minecraft Instances</Text>
			<Flex rowGap={8} direction="column">
				{instances.map(instance =>
					<div key={instance.ID} style={{
						border: '1px solid var(--mantine-color-dark-4)',
						borderRadius: '4px',
						padding: '8px'
					}}>
						<Flex justify="space-between" align="center" mb={4}>
							<Text fw={500}>{instance.Name || instance.MinecraftDirectory}</Text>
							{instance.ID === activeInstance && <Badge>Active</Badge>}
						</Flex>
						<Flex direction="column" rowGap={8}>
							<InstanceNameField id={instance.ID} name={instance.Name} directory={instance.MinecraftDirectory} onCommit={setName} />
							<TextInput label="Minecraft Location" value={instance.MinecraftDirectory} readOnly classNames={{
								input: css.selectFolder
							}} onClick={() => setDirectory(instance.ID)} />
							<Select label="Default filter" placeholder="None" clearable
								data={savedSearches} value={instance.DefaultSearch || null}
								onChange={(value) => setDefaultSearch(instance.ID, value || '')}
							/>
							<Button size="compact-sm" bg="red" onClick={() => removeInstance(instance.ID, instance.Name || instance.MinecraftDirectory)}
								disabled={instances.length <= 1}>Remove Instance</Button>
						</Flex>
					</div>
				)}
				<Button onClick={addInstance}>Add Instance</Button>
			</Flex>

			<hr />

			<Flex rowGap={8} direction="column">
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
