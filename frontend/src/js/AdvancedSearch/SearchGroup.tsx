import { Fragment, useEffect, KeyboardEvent, ChangeEvent } from 'react'
import { v4 as uuid } from 'uuid'
import { Fieldset, NativeSelect, Group, Flex, ActionIcon, Modal } from '@mantine/core'

import { ISearchGroup, Input, InputValue, SearchMode, SearchType } from '../AdvancedSearch'
import RemoveButton from './RemoveButton'
import AddButton from './AddButton'
import { findNestedInput, findGroupParent } from '../utils/searchGroup'
import SearchInput from '../SearchInput'

import css from '../../css/AdvancedSearch/SearchGroup.module.css'
import { IconHelp } from '@tabler/icons-react'
import { useDisclosure } from '@mantine/hooks'
import SearchModeHelp from './SearchModeHelp'

export interface SearchGroupProps {
	id?: string
	searchData: ISearchGroup
	setSearchData: React.Dispatch<React.SetStateAction<ISearchGroup>>
	remove?: Function
}

export default function SearchGroup({
	id,
	searchData,
	setSearchData,
	remove
}: SearchGroupProps) {
	const [helpOpened, { close: closeHelp, open: openHelp }] = useDisclosure(false);

	function sortInputs(inputs: Input[]) {
		// Groups should always be below inputs
		inputs.sort((a, b) => {
			if (typeof b.value === 'object' && typeof a.value === 'string') {
				return -1;
			}

			return 0;
		})

		for (let input of inputs) {
			if (typeof input.value === 'string') continue;
			sortInputs(input.value.terms);
		}
	}

	function addInput(value: InputValue = '') {
		setSearchData(s => {
			let tmpInputs = [...s.terms];

			if (!id) {
				tmpInputs.push({
					key: uuid(),
					value
				})
			} else {
				(findNestedInput(tmpInputs, id)?.value as ISearchGroup).terms.push({
					key: uuid(),
					value
				})
			}

			sortInputs(tmpInputs);

			return {
				mode: s.mode,
				type: s.type,
				terms: tmpInputs
			};
		})
	}

	function setSearchMode(e: ChangeEvent<HTMLSelectElement>) {
		setSearchData(s => {
			let tmpState = {...s};
			
			if (!id) {
				tmpState.mode = e.target.value as SearchMode;
			} else {
				let input = findNestedInput(tmpState.terms, id);
				if (!input) return s;
				(input.value as ISearchGroup).mode = e.target.value as SearchMode;
			}

			return tmpState;
		})
	}

	function setSearchType(e: ChangeEvent<HTMLSelectElement>) {
		setSearchData(s => {
			let tmpState = {...s};
			
			if (!id) {
				tmpState.type = e.target.value as SearchType;
			} else {
				let input = findNestedInput(tmpState.terms, id);
				if (!input) return s;
				(input.value as ISearchGroup).type = e.target.value as SearchType;
			}

			return tmpState;
		})
	}

	function onChange(key: string, event: KeyboardEvent<HTMLInputElement>) {
		setSearchData(s => {
			let tmpInputs = [...s.terms];

			let nestedInput = findNestedInput(tmpInputs, key);
			if (!nestedInput) return s;
			nestedInput.value = (event.target as HTMLInputElement).value;

			return {
				mode: s.mode,
				type: s.type,
				terms: tmpInputs
			};
		})
	}

	function onClear(key: string) {
		setSearchData(s => {
			let tmpInputs = [...s.terms];

			let nestedInput = findNestedInput(tmpInputs, key);
			if (!nestedInput) return s;
			nestedInput.value = '';

			return {
				mode: s.mode,
				type: s.type,
				terms: tmpInputs
			};
		})
	}

	function removeInput(key: string | undefined) {
		if (!key) return;

		setSearchData(s => {
			if (!id) {
				return {
					mode: s.mode,
					type: s.type,
					terms: s.terms.filter(t => t.key != key)
				}
			} else {
				let tempState = {...s};
				let parent = findGroupParent(tempState, key);
				if (!parent) return s;
				parent.terms = parent.terms.filter(t => t.key != key);
				return tempState;
			}
		})
	}

	function removeGroup(key: string) {
		setSearchData(s => {
			let tmpState = {...s};

			let groupParent = findGroupParent(tmpState, key);
			if (!groupParent) return s;
			groupParent.terms = groupParent.terms.filter(t => t.key != key);

			return tmpState;
		})
	}

	return (
		<>
			<Fieldset w="100%" legend="Search group" data-id={id} classNames={{
				root: css.group
			}}>
				<Flex justify="space-between" align="center" gap="16px">
					<Group w="100%" grow>
						<NativeSelect label="Search mode" data={['all', 'any']} value={searchData.mode} onChange={setSearchMode} />
						<NativeSelect label="Search type" data={['include', 'exclude']} value={searchData.type} onChange={setSearchType} />
					</Group>
					<ActionIcon onClick={openHelp}><IconHelp /></ActionIcon>
				</Flex>

				<Flex direction="column" rowGap="8px" style={{
					marginTop: '8px'
				}}>
					{searchData.terms.filter(v => typeof v.value === 'string').length === 0 && <AddButton addInput={() => addInput('')}
						addGroup={() => addInput({ mode: 'all', type: 'include', terms: [{ key: uuid(), value: '' }] })} alignEnd />}

					{searchData.terms.map((e, i, a) =>
						<Flex justify="space-between" align="center" gap="8px" w="100%" style={{
							flexGrow: 1
						}} key={e.key}>
							{typeof e.value === 'string' ? <>
									<Group w="100%" grow>
										<SearchInput data={e} onChange={onChange} onClear={onClear} />
									</Group>
									<RemoveButton disable={a.length === 1} remove={() => removeInput(e.key)} />
								</> :
								<SearchGroup searchData={e.value} remove={() => removeGroup(e.key)} setSearchData={setSearchData} id={e.key} />
							}
							{i === a.filter(v => typeof v.value === 'string').length - 1 && <AddButton addInput={() => addInput('')} addGroup={() => addInput({ mode: 'all', type: 'include', terms: [{ key: uuid(), value: '' }] })} />}
						</Flex>
					)}

					{remove && <RemoveButton remove={remove} text="Remove group" red alignEnd />}
				</Flex>
			</Fieldset>

			<Modal opened={helpOpened} onClose={closeHelp} title="Advanced Search Help" centered>
				<SearchModeHelp />
			</Modal>
		</>
	)
}