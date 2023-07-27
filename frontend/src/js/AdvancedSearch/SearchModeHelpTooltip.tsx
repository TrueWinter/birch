import { MutableRefObject } from 'react'
import HelpTooltip from './HelpTooltip'

interface SearchModeHelpTooltipProps {
	buttonRef: MutableRefObject<HTMLButtonElement> | undefined
}

export default function SearchModeHelpTooltip({
	buttonRef
}: SearchModeHelpTooltipProps) {

	return (
		<>
			<HelpTooltip buttonRef={buttonRef}>
				<div>There are two modes:</div>
				<ul>
					<li>all: Shows a log line if it contains all search terms in this group</li>
					<li>any: Shows a log line if it contains any of the search terms in this group</li>
				</ul>
			</HelpTooltip>
		</>
	)
}