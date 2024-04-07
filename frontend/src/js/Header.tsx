import { KeyboardEvent, useEffect, useRef } from 'react'
import { ISearchGroup } from './AdvancedSearch'

import { Button, Flex, TextInput, Center, Anchor, ActionIcon } from '@mantine/core'
import { IconFolder, IconSettings } from '@tabler/icons-react'

interface HeaderProps {
	openSettings: Function
	openFileSelector: Function
	openAdvancedSearch: Function
	clearLogs: Function
	setSearchQuery: Function
	searchQuery: string | ISearchGroup
	nonLatestFileLoaded: boolean
}

export default function Header({
	openSettings,
	openFileSelector,
	openAdvancedSearch,
	clearLogs,
	setSearchQuery,
	searchQuery,
	nonLatestFileLoaded
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