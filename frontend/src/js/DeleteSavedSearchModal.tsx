import { Modal, Button, Stack } from '@mantine/core'
import { ModalBaseProps } from './App'

interface Props extends ModalBaseProps{
	name: string
	deleteFn: (name: string) => void
}

export default function DeleteSavedSearchModal({
	opened,
	close,
	name,
	deleteFn
}: Props) {
	function del() {
		deleteFn(name);
		close();
	}

	return (
		<Modal opened={opened} onClose={close} title="Delete Saved Search" centered>
			<Stack>
				<div>Are you sure you want to delete <b>{name}</b>?</div>
			
				<Button bg="red" onClick={del}>Delete</Button>
			</Stack>
		</Modal>
	)
}