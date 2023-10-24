import { useEffect, useRef } from 'react'
import Skeleton from 'react-loading-skeleton'
import LogLine from './LogLine'
import { ISearchGroup } from './AdvancedSearch'
import { Log } from './App'

import { filter as doFilter } from './utils/search'

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

	function filter(e: Log): boolean {
		return doFilter(skipFilter, searchQuery, e);
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