import { useEffect, useRef, useState } from 'react';
import { createPopper, Instance as PopperInstance } from '@popperjs/core';

import buttonCss from '../../css/AdvancedSearch/SearchModeHelpButton.module.css'

interface SearchModeHelpButtonProps {
	text: string
}

export default function SearchModeHelpButton({
	text
}: SearchModeHelpButtonProps) {
	const buttonRef = useRef(null as unknown as HTMLButtonElement);
	const menuRef = useRef(null as unknown as HTMLDivElement);
	const [menuShown, setMenuShown] = useState(false);
	const popperRef = useRef(null as unknown as PopperInstance);

	useEffect(() => {
		popperRef.current = createPopper(buttonRef.current, menuRef.current, {
			placement: 'top-start'
		})

		return () => popperRef.current?.destroy()
	}, [])

	useEffect(() => {
		popperRef.current?.update()
	})

	return (
		<>
			<div ref={menuRef} className={buttonCss.tooltip} data-show={menuShown}>
				<div>There are two modes:</div>
				<ul>
					<li>all: Shows a log line if it contains all search terms in this group</li>
					<li>any: Shows a log line if it contains any of the search terms in this group</li>
				</ul>
			</div>
			<button ref={buttonRef} className={buttonCss.button} onMouseEnter={() => setMenuShown(true)} onMouseLeave={() => setMenuShown(false)}>?</button>
		</>
	)
}