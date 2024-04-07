import { useRef } from 'react'
import { Modal, TextInput, Button, Stack, Group, HoverCard } from '@mantine/core'
import { ModalBaseProps } from './App'

interface LoadSavedSearchProps extends ModalBaseProps {
	saveSearch: Function
	exportSearch: Function
}

export default function SaveSearch({
	opened,
	close,
	saveSearch,
	exportSearch
}: LoadSavedSearchProps) {
	const inputRef = useRef(null);

	function save() {
		saveSearch((inputRef.current as unknown as HTMLInputElement).value);
	}

	function exportToFile() {
		exportSearch((inputRef.current as unknown as HTMLInputElement).value);
	}

	return (
		<Modal opened={opened} onClose={close} title="Save Search Query" centered>
			<Stack>
				<TextInput label="Name" ref={inputRef} />

				<Group gap="xs">
					<HoverCard width={300} withArrow arrowSize={12}>
						<HoverCard.Target>
							<Button onClick={save}>Save</Button>
						</HoverCard.Target>
						<HoverCard.Dropdown>
							Save the search query so you can use it again later
						</HoverCard.Dropdown>
					</HoverCard>

					<HoverCard width={300} withArrow arrowSize={12}>
						<HoverCard.Target>
							<Button onClick={exportToFile}>Export</Button>
						</HoverCard.Target>
						<HoverCard.Dropdown>
							Export the search query to a location of your choosing. This allows you to share a search query with someone else.
						</HoverCard.Dropdown>
					</HoverCard>
				</Group>
			</Stack>
		</Modal>
	)
}