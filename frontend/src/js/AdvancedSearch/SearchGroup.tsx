import { Fragment, useEffect, useState, KeyboardEvent, ChangeEvent } from 'react'
import { v4 as uuid } from 'uuid'
import { ISearchGroup, Input, InputValue, SearchMode } from '../AdvancedSearch'
import RemoveButton from './RemoveButton'
import AddButton from './AddButton'

import css from '../../css/AdvancedSearch/SearchGroup.module.css'
import asCss from '../../css/AdvancedSearch.module.css'
import SearchModeHelpButton from './SearchModeHelpButton'

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
	function findNestedInput(inputs: Input[], key: string): Input | undefined {
		for (let input in inputs) {
			if (inputs[input].key === key) {
				return inputs[input];
			} else {
				if (typeof inputs[input] === 'string') continue;
				let nestedInput = findNestedInput((inputs[input].value as ISearchGroup).terms, key)
				if (nestedInput) return nestedInput;
			}
		}
	}

	function findGroupParent(groups: ISearchGroup, groupKey: string): ISearchGroup | undefined {
		for (let group in groups.terms) {
			if (groups.terms[group].key === groupKey) {
				return groups;
			} else {
				if (typeof groups.terms[group].value === 'string') continue;
				let groupParent = findGroupParent(groups.terms[group].value as ISearchGroup, groupKey);
				if (groupParent) return groupParent;
			}
		}
	}

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

	function onChange(key: string, event: KeyboardEvent<HTMLInputElement>) {
		setSearchData(s => {
			let tmpInputs = [...s.terms];

			let nestedInput = findNestedInput(tmpInputs, key);
			if (!nestedInput) return s;
			nestedInput.value = (event.target as HTMLInputElement).value;

			return {
				mode: s.mode,
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

	useEffect(() => {
		if (searchData.terms.length === 0) {
			addInput();
		}
	})

	return (
		<div data-id={id} className={css.group}>
			<div className={['input-box', asCss.mb8].join(' ')}>
				Search mode: <select className="input" autoComplete="off" value={searchData.mode} onChange={setSearchMode}>
					<option value="all">all</option>
					<option value="any">any</option>
				</select>
				<SearchModeHelpButton text={`The log viewer will show lines that match ${searchData.mode} of the search terms in this group.`} />
			</div>

			<div>
				{searchData.terms.map((e, i, a) =>
					<Fragment key={e.key}>
						<div className={['input-box', asCss.mb8].join(' ')}>
							{typeof e.value === 'string' ? 
								<>
									<input className={['input', css.input].join(' ')} type="text" defaultValue={e.value} onKeyUp={(ev) => onChange(e.key, ev)} />
									<RemoveButton remove={() => removeInput(e.key)} />
								</> :
								<SearchGroup searchData={e.value} remove={() => removeGroup(e.key)} setSearchData={setSearchData} id={e.key} />
							}
							{i === a.filter(v => typeof v.value === 'string').length - 1 && <AddButton addInput={() => addInput('')} addGroup={() => addInput({ mode: 'all', terms: [{ key: uuid(), value: '' }] })} />}
						</div>
					</Fragment>
				)}
				{remove && <RemoveButton remove={remove} className={css['remove-group']} text="Remove group" />}
			</div>
		</div>
	)
}