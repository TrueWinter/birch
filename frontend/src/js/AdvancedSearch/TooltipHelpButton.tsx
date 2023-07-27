import { useRef, MutableRefObject } from 'react'

import buttonCss from '../../css/AdvancedSearch/TooltipHelpButton.module.css'

interface TooltipHelpButtonProps {
	setButtonRef: React.Dispatch<React.SetStateAction<MutableRefObject<HTMLButtonElement> | undefined>>
}

export default function TooltipHelpButton({
	setButtonRef
}: TooltipHelpButtonProps) {
	const buttonRef = useRef(null as unknown as HTMLButtonElement);

	return (
		<>
			<button ref={buttonRef} className={buttonCss.button} onMouseEnter={() => setButtonRef(buttonRef)} onMouseLeave={() => setButtonRef(undefined)}>?</button>
		</>
	)
}