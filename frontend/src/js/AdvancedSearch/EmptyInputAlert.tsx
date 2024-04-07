import { Modal, Text } from '@mantine/core';
import { ModalBaseProps } from '../App';

export default function EmptyInputAlert({
	opened,
	close
}: ModalBaseProps) {
	return (
		<Modal opened={opened} onClose={close} title="Invalid Search" centered>
			<Text>This search contains empty input(s) which will result in all messages being filtered out.</Text>
			<Text size="sm" style={{
				marginTop: '8px'
			}}>Are you trying to clear your search? Close the Advanced Search modal and simply click on the Search button in the header, ensuring that the search input is blank.</Text>
		</Modal>
	)
}