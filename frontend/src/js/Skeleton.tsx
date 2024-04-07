import { Skeleton as S, type SkeletonProps, Flex } from '@mantine/core'

interface Props extends SkeletonProps {
	gap?: string
	number?: number
}

export default function Skeleton(props: Props) {
	return (
		<Flex rowGap={props.gap || '8px'} direction="column">
			{new Array(props.number || 1).fill(null).map((e, i) => <S key={i} {...props} />)}
		</Flex>
	)
}