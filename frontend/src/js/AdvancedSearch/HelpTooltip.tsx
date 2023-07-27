import { useEffect, useRef, MutableRefObject } from 'react';
import { createPopper, Instance as PopperInstance } from '@popperjs/core';

import css from '../../css/AdvancedSearch/HelpTooltip.module.css'

interface HelpTooltipProps {
	buttonRef: MutableRefObject<HTMLButtonElement> | undefined
	children: React.ReactElement | React.ReactElement[]
}

export default function HelpTooltip({
	buttonRef,
	children
}: HelpTooltipProps) {
	const menuRef = useRef(null as unknown as HTMLDivElement);
	const popperRef = useRef(null as unknown as PopperInstance);

	useEffect(() => {
		if (!buttonRef) return;

		popperRef.current = createPopper(buttonRef.current, menuRef.current, {
			placement: 'top-start'
		})

		return () => popperRef.current?.destroy()
	}, [buttonRef])

	return (
		<>
			<div ref={menuRef} className={css.tooltip}>
				{children}
			</div>
		</>
	)
}