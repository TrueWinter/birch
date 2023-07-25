import buttonCss from '../../css/AdvancedSearch/RemoveButton.module.css'

interface RemoveButtonProps {
	remove: Function
	className?: string
	text?: string
}

export default function RemoveButton({
	remove,
	className = '',
	text = '-'
}: RemoveButtonProps) {
	return (
		<>
			<button className={[buttonCss.button, buttonCss.mr8, className].filter(e=>e).join(' ')} onClick={() => remove()}>{text}</button>
		</>
	)
}