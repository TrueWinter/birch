import { Fragment, useEffect, KeyboardEvent, ChangeEvent } from 'react'
import { v4 as uuid } from 'uuid'

import { ISearchGroup, Input, InputValue, SearchMode, SearchType } from '../AdvancedSearch'
import RemoveButton from './RemoveButton'
import AddButton from './AddButton'
import TooltipHelpButton from './TooltipHelpButton'
import { findNestedInput, findGroupParent } from '../utils/searchGroup'
import SearchInput from '../SearchInput'

import css from '../../css/AdvancedSearch/SearchGroup.module.css'
import asCss from '../../css/AdvancedSearch.module.css'

export interface SearchGroupProps {
	id?: string
	searchData: ISearchGroup
	setSearchData: React.Dispatch<React.SetStateAction<ISearchGroup>>
	setSearchModeHelpButtonRef: React.Dispatch<React.SetStateAction<React.MutableRefObject<HTMLButtonElement> | undefined>>
	setSearchTypeHelpButtonRef: React.Dispatch<React.SetStateAction<React.MutableRefObject<HTMLButtonElement> | undefined>>
	remove?: Function
}

export default function SearchGroup({
	id,
	searchData,
	setSearchData,
	setSearchModeHelpButtonRef,
	setSearchTypeHelpButtonRef,
	remove
}: SearchGroupProps) {
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
				<TooltipHelpButton setButtonRef={setSearchModeHelpButtonRef} />
			</div>
			<div className={['input-box', asCss.mb8].join(' ')}>
				Search type: <select className="input" autoComplete="off" value={searchData.type} onChange={setSearchType}>
					<option value="include">include</option>
					<option value="exclude">exclude</option>
				</select>
				<TooltipHelpButton setButtonRef={setSearchTypeHelpButtonRef} />
			</div>

			{searchData.terms.filter(v => typeof v.value === 'string').length === 0 && <AddButton className={asCss.mb8} addInput={() => addInput('')} addGroup={() => addInput({ mode: 'all', type: 'include', terms: [{ key: uuid(), value: '' }] })} />}

			<div>
				{searchData.terms.map((e, i, a) =>
					<Fragment key={e.key}>
						<div className={['input-box', asCss.mb8].join(' ')}>
							{typeof e.value === 'string' ? 
								<>
									<SearchInput data={e} onChange={onChange} onClear={onClear} />
									<RemoveButton disable={a.length === 1} remove={() => removeInput(e.key)} />
								</> :
								<SearchGroup searchData={e.value} remove={() => removeGroup(e.key)} setSearchData={setSearchData} id={e.key}
									setSearchModeHelpButtonRef={setSearchModeHelpButtonRef} setSearchTypeHelpButtonRef={setSearchTypeHelpButtonRef} />
							}
							{i === a.filter(v => typeof v.value === 'string').length - 1 && <AddButton addInput={() => addInput('')} addGroup={() => addInput({ mode: 'all', type: 'include', terms: [{ key: uuid(), value: '' }] })} />}
						</div>
					</Fragment>
				)}
				{remove && <RemoveButton remove={remove} className={css['remove-group']} text="Remove group" />}
			</div>
		</div>
	)
}