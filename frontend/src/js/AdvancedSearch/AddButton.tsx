import { Button, Popover, Stack, Tooltip, Text } from '@mantine/core'
import { useState } from 'react'

interface AddButtonProps {
	addInput: Function
	addGroup: Function
	alignEnd?: boolean
}

export default function AddButton({
	addInput, addGroup, alignEnd = false
}: AddButtonProps) {
	const [opened, setOpened] = useState(false);

	function handleMenuClick(type: 'input' | 'group') {
		switch (type) {
			case 'input':
				addInput();
				break;
			case 'group':
				addGroup();
				break;
		}

		setOpened(false);
	}

	return (
		<>
			<Popover opened={opened} onChange={setOpened} withArrow>
				<Popover.Target>
					<Button size="compact-md" onClick={() => setOpened(o => !o)} style={{
						alignSelf: alignEnd ? 'end' : undefined
					}}>+</Button>
				</Popover.Target>
				<Popover.Dropdown>
					<Stack gap="8px">
						<Tooltip label="Adds a text input" color="dark" withArrow>
							<Button onClick={() => handleMenuClick('input')}>Add input</Button>
						</Tooltip>
						<Tooltip w={300} multiline label="Adds a search group. Search groups are evaluated after inputs." color="dark" withArrow>
							<Button onClick={() => handleMenuClick('group')}>Add group</Button>
						</Tooltip>
						<Text size="xs" w={150} style={{
							textAlign: 'center'
						}}>Inputs and groups are added after all other elements of the same type.</Text>
					</Stack>
				</Popover.Dropdown>
			</Popover>
		</>
	)
}