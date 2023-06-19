import S from 'react-loading-skeleton'
import type { SkeletonProps } from 'react-loading-skeleton/dist/Skeleton.d.ts'

import 'react-loading-skeleton/dist/skeleton.css'

export default function Skeleton(props: SkeletonProps) {
	return (
		<S baseColor="#444" highlightColor="#666" {...props} />
	)
}