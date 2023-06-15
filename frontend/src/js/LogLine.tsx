interface LogLineProps {
	text: string
}

export default function LogLine({ text }: LogLineProps) {
	return (
		<div className="log-line">{text}</div>
	)
}