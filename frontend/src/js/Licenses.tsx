import dompurify from 'dompurify'
import { BrowserOpenURL } from '../../wailsjs/runtime/runtime'
import licenses from '../../../licenses.json'
import CloseButton from './CloseButton'

import css from '../css/Licenses.module.css'

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

interface LicensesProps {
	setLicensesShown: Function
}

export default function Licenses({
	setLicensesShown
}: LicensesProps) {
	return (
		<div className={css.popup}>
			<h1 className={css.heading}>Open Source Licenses
				<CloseButton onClick={() => setLicensesShown(false)} props={{
					className: css.closeButton
				}} />
			</h1>
			<p>Birch is <a href="#" onClick={() => BrowserOpenURL('https://github.com/TrueWinter/birch')}>open-source software</a>, and as with most software, it would not be possible without the work of open-source software developers.</p>
			<div className={css.licenses}>
				{licenses.map(e => <div key={e.module}>
					<h2>{e.module}</h2>
					<RenderHTMLSafely string={e.license.replace(/\n/g, '<br />')}/>
				</div>)}
			</div>
		</div>
	)
}