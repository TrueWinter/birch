import { Button } from '@mantine/core'

interface RemoveButtonProps {
	remove: Function
	text?: string
	disable?: boolean
	red?: boolean
	alignEnd?: boolean
}

export default function RemoveButton({
	remove,
	text = '-',
	disable = false,
	red = false,
	alignEnd = false
}: RemoveButtonProps) {
	return (
		<>
			<Button size="compact-md" bg={red ? 'red' : undefined} onClick={() => remove()} disabled={disable} style={{
				alignSelf: alignEnd ? 'end' : undefined
			}}>{text}</Button>
		</>
	)
}