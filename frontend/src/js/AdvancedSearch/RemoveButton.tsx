import buttonCss from '../../css/AdvancedSearch/RemoveButton.module.css'

interface RemoveButtonProps {
	remove: Function
	className?: string
	text?: string
	disable?: boolean
}

export default function RemoveButton({
	remove,
	className = '',
	text = '-',
	disable = false
}: RemoveButtonProps) {
	return (
		<>
			<button className={[buttonCss.button, buttonCss.mr8, className].filter(e=>e).join(' ')} onClick={() => remove()} disabled={disable}>{text}</button>
		</>
	)
}