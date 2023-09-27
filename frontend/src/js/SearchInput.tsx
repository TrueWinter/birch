import { useRef } from 'react'
import { Input } from './AdvancedSearch'

import css from '../css/SearchInput.module.css'

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
		<span className={css.inputBox}>
			<input ref={inputRef} className={['input', css.input].join(' ')} type="text" defaultValue={data.value as string} onKeyUp={(e) => onChange(data.key, e)} />
			<span className={css.clear} onClick={(e) => clear(data.key)}>x</span>
		</span>
	)
}