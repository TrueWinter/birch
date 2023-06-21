import { HTMLAttributes } from 'react'
import css from '../css/CloseButton.module.css'

interface CloseButtonProps {
	onClick: Function
	props?: React.DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
}

export default function CloseButton({ onClick, props }: CloseButtonProps) {
	const propsClassName = props?.className;
	delete props?.className;
	delete props?.onClick;

	return (
		<div className={[css.closeButton, propsClassName].join(' ')} onClick={onClick as any} {...props}>X</div>
	)
}