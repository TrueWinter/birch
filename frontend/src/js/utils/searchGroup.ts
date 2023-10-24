import { type Input, type ISearchGroup } from '../AdvancedSearch';

export function findNestedInput(inputs: Input[], key: string): Input | undefined {
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

export function findGroupParent(groups: ISearchGroup, groupKey: string): ISearchGroup | undefined {
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