import { useEffect, useRef, useState } from 'react'
import { ScrollArea } from '@mantine/core'
import LogLine from './LogLine'
import { ISearchGroup } from './AdvancedSearch'
import { Log } from './App'

import { filter as doFilter } from './utils/search'
import Skeleton from './Skeleton'

const SCROLL_BUFFER_PX = 24;

interface LogViewerProps {
	logs: Log[]
	searchQuery: ISearchGroup | string
	skipFilter: boolean,
	loading: boolean
}

export default function LogViewer({
	logs, searchQuery, skipFilter, loading
}: LogViewerProps) {
	const isUserScrolling = useRef(false);
	const viewerRef = useRef(null as unknown as HTMLDivElement);
	const [prevSearchQuery, setPrevSearchQuery] = useState<ISearchGroup | string>();

	function filter(e: Log): boolean {
		return doFilter(skipFilter, searchQuery, e);
	}

	function handleScroll({ y }: { y: number }) {
		isUserScrolling.current = true;

		const distanceFromBottom =
			viewerRef.current.scrollHeight - y - viewerRef.current.clientHeight;

		if (distanceFromBottom <= SCROLL_BUFFER_PX) {
			isUserScrolling.current = false;
		}
	}

	if (searchQuery !== prevSearchQuery) {
		isUserScrolling.current = false;
		setPrevSearchQuery(searchQuery);
	}

	function isEditingElsewhere(): boolean {
		const active = document.activeElement as HTMLElement | null;
		if (active && viewerRef.current?.contains(active)) return false;

		return !!document.querySelector('[role="dialog"]') ||
			!!active && (
				active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' ||
				active.tagName === 'SELECT' || active.isContentEditable
			);
	}

	// Because React hasn't yet rendered the logs, there's nothing to scroll down to at this point so scroll at the next tick.
	useEffect(() => {
		const timeout = setTimeout(() => {
			if (viewerRef.current) {
				if (!isUserScrolling.current) {
					viewerRef.current?.scrollTo(0, viewerRef.current.scrollHeight);
				}

				// Don't steal focus from an open modal or text input being edited.
				if (!isEditingElsewhere()) {
					viewerRef.current?.focus();
				}
			}
		});

		return () => clearTimeout(timeout);
	}, [logs, searchQuery]);

	return (
		<>
			<ScrollArea offsetScrollbars="y" scrollbars="y" viewportRef={viewerRef} style={{
				padding: '8px',
				overflowWrap: 'break-word'
			}} onScrollPositionChange={handleScroll}>
				{
					(logs.length === 0 && loading) ?
					<Skeleton h="1em" number={10} /> :
					logs.filter(filter)
						.map(e => <LogLine key={e.id} text={e.text} />)
				}
			</ScrollArea>
		</>
	)
}