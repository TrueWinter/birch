import css from '../css/Overlay.module.css'

interface OverlayProps {
	id: string
	shown: boolean
}

export default function Overlay({ id, shown }: OverlayProps) {
	return (
		<div className={css.overlay} data-overlay-id={id} style={{display: shown ? undefined : 'none'}}></div>
	)
}