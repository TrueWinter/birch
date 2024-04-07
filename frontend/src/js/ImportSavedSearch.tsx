import { useRef } from 'react'
import { Button, Modal, TextInput, Stack } from '@mantine/core'
import { ModalBaseProps } from './App'

import { main } from '../../wailsjs/go/models'

interface ImportSavedSearchProps extends ModalBaseProps {
	setLoadSavedSearchRenderCount: Function
	saveSearch: Function
	search: main.NamedSearch
}

export default function ImportSavedSearch({
	opened,
	close,
	setLoadSavedSearchRenderCount,
	saveSearch,
	search
}: ImportSavedSearchProps) {
	const nameRef = useRef(null as unknown as HTMLInputElement);

	function importSearch() {
		saveSearch(nameRef.current?.value, search.data);
		close();
	}

	return (
		<Modal opened={opened} onClose={close} title="Load Saved Search Query" centered>
			<Stack>
				<TextInput defaultValue={search.name} ref={nameRef} />
				<Button onClick={() => importSearch()}>Import</Button>
			</Stack>
		</Modal>
	)
}