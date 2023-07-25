import { useEffect, useState } from 'react'
import css from '../css/Overlay.module.css'

interface OverlayProps {
	id: string
	shown: boolean
	parentRef?: React.RefObject<HTMLElement>
}

export default function Overlay({ id, shown, parentRef }: OverlayProps) {
	const [scrollPx, setScrollPx] = useState(0 as number | undefined);

	// Really hacky way of ensuring the overlay covers the while parent element
	function handleScroll() {
		setScrollPx(parentRef?.current?.scrollTop);
	}

	useEffect(() => {
		parentRef?.current?.addEventListener('scroll', handleScroll)
	})

	return (
		<div className={css.overlay} data-overlay-id={id} style={{display: shown ? undefined : 'none', top: scrollPx ? `${scrollPx}px` : 0}}></div>
	)
}