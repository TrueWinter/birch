import { useEffect, useRef } from 'react'
import Skeleton from 'react-loading-skeleton'
import LogLine from './LogLine'
import { SearchQueryWithTerms } from './AdvancedSearch'
import { Log } from './App'

import 'react-loading-skeleton/dist/skeleton.css'
import css from '../css/LogViewer.module.css'

interface LogViewerProps {
	logs: Log[]
	headerHeight: number
	searchQuery: SearchQueryWithTerms | string
	skipFilter: boolean,
	loading: boolean
}

export default function LogViewer({
	logs, headerHeight, searchQuery, skipFilter, loading
}: LogViewerProps) {
	const isUserScrolling = useRef(false);
	const viewerRef = useRef(null as unknown as HTMLDivElement);

	function handleResize() {
		viewerRef.current.style.height = `${window.innerHeight - headerHeight - 2 - 20}px`;
		viewerRef.current.scrollTo(0, viewerRef.current.scrollHeight);
	}

	function filter(e: Log) {
		if (skipFilter) return true;

		if (typeof searchQuery === 'string') {
			return e.text.toLowerCase().includes((searchQuery as string).toLowerCase());
		} else if (typeof searchQuery === 'object') {
			switch (searchQuery.mode) {
				case 'and':
					let matchesForAndSearch = 0;
					for (let j = 0; j < searchQuery.terms.length; j++) {
						if (e.text.toLowerCase().includes(searchQuery.terms[j].toLowerCase())) {
							matchesForAndSearch++;
						}
					}
	
					// If this log line matches all searched terms, show it
					return matchesForAndSearch === searchQuery.terms.length;
				case 'or':
					let matchesForOrSearch = 0;
					for (let j = 0; j < searchQuery.terms.length; j++) {
						if (e.text.toLowerCase().includes(searchQuery.terms[j].toLowerCase())) {
							matchesForOrSearch++;
						}
					}
	
					// If this log line matches any searched terms, show it
					return matchesForOrSearch > 0;
				default:
					return;
			}
		}
	}

	function handleScroll() {
		isUserScrolling.current = true;

		if (viewerRef.current.scrollHeight ===
			viewerRef.current.scrollTop +
			viewerRef.current.clientHeight) {
				isUserScrolling.current = false;
			}

		return () => {
			isUserScrolling.current = false;
		}
	}

	useEffect(() => {
		window.addEventListener('resize', handleResize);
		viewerRef.current?.addEventListener('scroll', handleScroll);

		return () => {
			window.removeEventListener('resize', handleResize);
			viewerRef.current?.removeEventListener('scroll', handleScroll);
		}
	}, [headerHeight]);

	useEffect(() => {
		if (!isUserScrolling.current) {
			viewerRef.current?.scrollTo(0, viewerRef.current.scrollHeight);
		}

		viewerRef.current?.focus();
	}, [logs]);

	useEffect(() => {
		handleResize();
	}, [headerHeight])

	useEffect(() => {
		isUserScrolling.current = false;
		viewerRef.current?.scrollTo(0, viewerRef.current.scrollHeight);
	}, [searchQuery])

	return (
		<>
			<div className={css.viewer} ref={viewerRef}>
				{
					logs.filter(filter)
						.map(e => <LogLine key={e.id} text={e.text} />)
				}
				{
					logs.length === 0 && loading &&
					<Skeleton count={10} baseColor="#444" highlightColor="#666" />
				}
			</div>
		</>
	)
}