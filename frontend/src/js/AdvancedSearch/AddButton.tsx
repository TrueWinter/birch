import { useEffect, useRef, useState } from 'react';
import { createPopper, Instance as PopperInstance } from '@popperjs/core';

import buttonCss from '../../css/AdvancedSearch/AddButton.module.css'

interface AddButtonProps {
	addInput: Function
	addGroup: Function
	className?: string
}

export default function AddButton({
	addInput, addGroup, className = ''
}: AddButtonProps) {
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

	function handleMenuClick(type: 'input' | 'group') {
		switch (type) {
			case 'input':
				addInput();
				break;
			case 'group':
				addGroup();
				break;
		}

		setMenuShown(false);
	}

	return (
		<>
			<div ref={menuRef} className={buttonCss.tooltip} data-show={menuShown}>
				<div onClick={() => handleMenuClick('input')}>Add input</div>
				<div onClick={() => handleMenuClick('group')}>Add group</div>
			</div>
			<button ref={buttonRef} className={[buttonCss.button, className].filter(e=>e).join(' ')} onClick={() => setMenuShown(s => !s)}>+</button>
		</>
	)
}