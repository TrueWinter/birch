import { KeyboardEvent, useEffect, useRef } from 'react'
import { ISearchGroup } from './AdvancedSearch'

import { Button, Flex, TextInput, Center, Anchor, ActionIcon, Menu } from '@mantine/core'
import { IconCheck, IconFolder, IconFolders, IconSettings } from '@tabler/icons-react'
import { main } from '../../wailsjs/go/models'

interface HeaderProps {
	openSettings: Function
	openFileSelector: Function
	openAdvancedSearch: Function
	clearLogs: Function
	setSearchQuery: Function
	searchQuery: string | ISearchGroup
	nonLatestFileLoaded: boolean
	instances: main.Instance[]
	activeInstance: string
	switchInstance: Function
}

export default function Header({
	openSettings,
	openFileSelector,
	openAdvancedSearch,
	clearLogs,
	setSearchQuery,
	searchQuery,
	nonLatestFileLoaded,
	instances,
	activeInstance,
	switchInstance
}: HeaderProps) {
	const headerRef = useRef(null as unknown as HTMLDivElement);
	const searchRef = useRef(null as unknown as HTMLInputElement);

	function onKeyUp(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			search();
		}
	}

	function search() {
		setSearchQuery(searchRef.current.value);
	}

	if (typeof searchQuery === 'object') {
		searchRef.current.value = '';
	}

	return (
		<>
			<Flex justify="space-between" align="center" style={{
				padding: '6px',
				borderBottom: '1px solid grey'
			}} ref={headerRef}>
				{!nonLatestFileLoaded ?
					<Button onClick={() => clearLogs(null)}>Clear Logs</Button> :
					<div>Non-latest log file loaded</div>
				}
				<Flex direction="column">
					<Flex columnGap={8}>
						<TextInput autoComplete="off" ref={searchRef} onKeyUp={onKeyUp} placeholder={typeof searchQuery === 'object' ? 'Using advanced search' : undefined} />
						<Button onClick={search}>Search</Button>
					</Flex>
					<Center><Anchor component="span" onClick={() => openAdvancedSearch()}>Use advanced search</Anchor></Center>
				</Flex>
				<Flex columnGap={8}>
					<Menu shadow="md" width={260} position="bottom-end">
						<Menu.Target>
							<ActionIcon size={40} aria-label="Switch Minecraft instance">
								<IconFolders size={32} />
							</ActionIcon>
						</Menu.Target>
						<Menu.Dropdown>
							<Menu.Label>Minecraft instances</Menu.Label>
							{instances.map(instance =>
								<Menu.Item key={instance.ID}
									leftSection={instance.ID === activeInstance ? <IconCheck size={16} /> : <div style={{ width: 16 }} />}
									onClick={() => switchInstance(instance.ID)}
								>
									{instance.Name || instance.MinecraftDirectory}
								</Menu.Item>
							)}
							<Menu.Divider />
							<Menu.Item onClick={() => openSettings()}>Manage instances...</Menu.Item>
						</Menu.Dropdown>
					</Menu>
					<ActionIcon onClick={() => openFileSelector()} size={40}>
						<IconFolder size={32} />
					</ActionIcon>
					{!nonLatestFileLoaded && 
						<ActionIcon onClick={() => openSettings()} size={40}>
							<IconSettings size={32} />
						</ActionIcon>
					}
				</Flex>
			</Flex>
		</>
	)
}