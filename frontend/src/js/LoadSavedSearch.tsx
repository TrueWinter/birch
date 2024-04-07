import { useEffect, useState, useRef } from 'react'
import { Modal, Button, Group, Text, Radio, Table, Anchor } from '@mantine/core'
import Skeleton from './Skeleton'
import ImportSavedSearch from './ImportSavedSearch'
import { ModalBaseProps } from './App'
import { main } from '../../wailsjs/go/models'
import { GetSavedSearches, ImportSearch } from '../../wailsjs/go/main/App'
import { useDisclosure } from '@mantine/hooks'
import DeleteSavedSearchModal from './DeleteSavedSearchModal'

interface LoadSavedSearchProps extends ModalBaseProps {
	loadSavedSearch: Function
	deleteSavedSearch: (name: string) => void
	loadSavedSearchRenderCount: number
	setLoadSavedSearchRenderCount: Function
	saveSearch: Function
	defaultSearch: string
	setDefaultSearch: Function
}

export default function LoadSavedSearch({
	opened,
	close,
	loadSavedSearch,
	deleteSavedSearch,
	loadSavedSearchRenderCount,
	setLoadSavedSearchRenderCount,
	saveSearch,
	defaultSearch,
	setDefaultSearch
}: LoadSavedSearchProps) {
	const [savedSearchQueries, setSavedSearchQueries] = useState([] as main.NamedSearch[]);
	const [loading, setLoading] = useState(true);
	const [importSavedSearchModalShown, { open: openImportSavedSearchModal, close: closeImportSavedSearchModal }] = useDisclosure(false);
	const [deleteSavedSearchModalShown, { open: openDeleteSavedSearchModal, close: closeDeleteSavedSearchModal }] = useDisclosure(false);
	const [toDeleteName, setToDeleteName] = useState('');
	const searchToImport = useRef({} as main.NamedSearch)

	function importSearch() {
		ImportSearch().then(search => {
			searchToImport.current = search;
			openImportSavedSearchModal();
		}).catch(err => {
			alert(`An error occurred: ${err}`);
		})
	}

	function confirmDeleteSavedSearch(name: string) {
		setToDeleteName(name);
		openDeleteSavedSearchModal();
	}

	useEffect(() => {
		GetSavedSearches().then(searches => {
			const queries = searches || [];
			setSavedSearchQueries(queries);
			setLoading(false);
		}).catch(err => {
			alert(`An error occurred: ${err}`);
		});
	},
	// See deleteSavedSearch() in AdvancedSearch.tsx
	[loadSavedSearchRenderCount, defaultSearch]);

	return (
		<>
			<Modal opened={opened} onClose={close} title="Load Saved Search Query" centered>
				<ImportSavedSearch opened={importSavedSearchModalShown} close={closeImportSavedSearchModal} saveSearch={saveSearch}
					search={searchToImport.current} setLoadSavedSearchRenderCount={setLoadSavedSearchRenderCount} />
				<div data-r={loadSavedSearchRenderCount}>
					<Anchor component="span" onClick={() => importSearch()}>Import from file</Anchor>

					<Table>
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Default</Table.Th>
								<Table.Th>Name</Table.Th>
								<Table.Th>Actions</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{savedSearchQueries.map(e =>
								<Table.Tr key={e.name}>
									<Table.Td><Radio type="radio" name="default" checked={e.name === defaultSearch} onClick={() => setDefaultSearch(e.name)} onChange={() => {}}></Radio></Table.Td>
									<Table.Td>{e.name}</Table.Td>
									<Table.Td>
										<Group gap="xs">
											<Button size="compact-md" onClick={() => loadSavedSearch(e.data)}>Load</Button>
											<Button size="compact-md" bg="red" onClick={() => confirmDeleteSavedSearch(e.name)}>Delete</Button>
										</Group>
									</Table.Td>
								</Table.Tr>
							)}

							{loading && <tr><td colSpan={3}><Skeleton height="34px" /></td></tr>}
						</Table.Tbody>
					</Table>

					<Text size="sm">The default search will be applied every time Birch is opened.</Text>
				</div>
			</Modal>

			<DeleteSavedSearchModal opened={deleteSavedSearchModalShown} close={closeDeleteSavedSearchModal} name={toDeleteName} deleteFn={deleteSavedSearch} />
		</>
	)
}