import css from '../css/CloseButton.module.css'

interface CloseButtonProps {
	onClick: Function
	props?: Object
}

export default function CloseButton({ onClick, props }: CloseButtonProps) {
	return (
		<div className={css.closeButton} onClick={onClick as any} {...props}>X</div>
	)
}