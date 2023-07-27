import { MutableRefObject } from 'react'
import HelpTooltip from './HelpTooltip'

interface SearchTypeHelpTooltipProps {
	buttonRef: MutableRefObject<HTMLButtonElement> | undefined
}

export default function SearchTypeHelpTooltip({
	buttonRef
}: SearchTypeHelpTooltipProps) {

	return (
		<>
			<HelpTooltip buttonRef={buttonRef}>
				<ul>
					<li>include: Shows a log line if it includes the search terms in this group</li>
					<li>exclude: Shows a log line if it does not include the search terms in this group</li>
				</ul>
			</HelpTooltip>
		</>
	)
}