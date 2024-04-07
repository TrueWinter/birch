import { useRef } from 'react'
import { Input } from './AdvancedSearch'
import { TextInput } from '@mantine/core'
import { IconX } from '@tabler/icons-react'

interface SearchInput {
	onChange: Function
	onClear: Function
	data: Input
}
export default function SearchInput({
	onChange,
	onClear,
	data
}: SearchInput) {
	let inputRef = useRef(null as unknown as HTMLInputElement);

	function clear(key: string) {
		inputRef.current.value = '';
		onClear(key);
	}

	return (
		<TextInput ref={inputRef} type="text" defaultValue={data.value as string} onKeyUp={(e) => onChange(data.key, e)}
			rightSection={<IconX cursor="pointer" size="1em" onClick={(e) => clear(data.key)} />} rightSectionPointerEvents="all" />
	)
}