import dompurify from 'dompurify'
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime'
import licenses from '../../../licenses.json'

import { Anchor, Modal, ScrollArea, Text } from '@mantine/core'

import css from '../css/Licenses.module.css'
import { ModalBaseProps } from './App'

interface RenderHTMLSafelyProps {
	string: string
}

function RenderHTMLSafely({ string }: RenderHTMLSafelyProps) {
	const clean = dompurify.sanitize(string, {
		ALLOWED_TAGS: ['br']
	})

	return <div style={{
		marginBottom: '8px'
	}} dangerouslySetInnerHTML={{ __html: clean }} />
}

export default function Licenses({
	opened,
	close
}: ModalBaseProps) {
	return (
		<Modal opened={opened} onClose={close} title="Open Source Licenses" centered>
			<div>Birch is <Anchor href="#" onClick={() => BrowserOpenURL('https://github.com/TrueWinter/birch')}>open-source software</Anchor>, and as with most software, it would not be possible without the work of open-source software developers.</div>
			<hr />
			<ScrollArea h={300} scrollbars="y" offsetScrollbars classNames={{
				viewport: css.licenses
			}}>
				{licenses.map(e => <div key={e.module}>
					<h2>{e.module}</h2>
					<RenderHTMLSafely string={e.license.replace(/\n/g, '<br />')}/>
				</div>)}
			</ScrollArea>
			<hr />
			<Text size="sm">Birch is not an official Minecraft product and is not approved by or associated with Mojang or Microsoft.</Text>
		</Modal>
	)
}