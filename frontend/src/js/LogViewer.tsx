import { useEffect, useRef } from 'react'
import Skeleton from 'react-loading-skeleton'
import LogLine from './LogLine'
import { ISearchGroup } from './AdvancedSearch'
import { Log } from './App'

import 'react-loading-skeleton/dist/skeleton.css'
import css from '../css/LogViewer.module.css'

interface LogViewerProps {
	logs: Log[]
	headerHeight: number
	searchQuery: ISearchGroup | string
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

	function doesMatch(e: Log, query: ISearchGroup): boolean {
		if (query.terms.length === 0) return true;

		switch (query.mode) {
			case 'all':
				let matches = 0;
				let total = query.terms.length;

				for (let term of query.terms) {
					if (typeof term.value === 'string') {
						if (term.value == '') continue;
						if (e.text.toLowerCase().includes(term.value.toLowerCase())) {
							matches++;
						}
					} else {
						if (doesMatch(e, term.value)) {
							matches++;
						}
					}
				}

				return query.type === 'include' ? matches === total : matches !== total;
			case 'any':
				for (let term of query.terms) {
					if (typeof term.value === 'string') {
						if (term.value == '') continue;
						if (e.text.toLowerCase().includes(term.value.toLowerCase())) {
							return query.type === 'include';
						}
					} else {
						if (doesMatch(e, term.value)) {
							return true;
						}
					}
				}

				return query.type !== 'include';
			default:
				return false;
		}
	}

	function filter(e: Log): boolean {
		if (skipFilter) return true;

		if (typeof searchQuery === 'string') {
			return e.text.toLowerCase().includes((searchQuery as string).toLowerCase());
		} else {
			return doesMatch(e, searchQuery);
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