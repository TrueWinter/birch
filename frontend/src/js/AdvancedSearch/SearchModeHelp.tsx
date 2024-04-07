import { Accordion } from '@mantine/core'

export default function SearchModeHelp() {
	const data = [{
		title: 'Search mode',
		description: <>
			<ul>
				<li>all: Shows a log line if it contains all search terms in this group</li>
				<li>any: Shows a log line if it contains any of the search terms in this group</li>
			</ul>
		</>
	}, {
		title: 'Search type',
		description: <>
			<ul>
				<li>include: Shows a log line if it includes the search terms in this group</li>
				<li>exclude: Shows a log line if it does not include the search terms in this group</li>
			</ul>
		</>
	}];

	return (
		<Accordion defaultValue={data[0].title}>
			{data.map(e => <Accordion.Item key={e.title} value={e.title}>
				<Accordion.Control>{e.title}</Accordion.Control>
				<Accordion.Panel>{e.description}</Accordion.Panel>
			</Accordion.Item>)}
		</Accordion>
	)
}