export interface SelectionModifiers {
	ctrl: boolean
	shift: boolean
}

export interface FileSelection {
	selected: Set<string>
	anchor: string | null
}

export function selectFile(
	visiblePaths: string[],
	currentSelection: Set<string>,
	anchor: string | null,
	clickedPath: string,
	modifiers: SelectionModifiers
): FileSelection {
	const clickedIndex = visiblePaths.indexOf(clickedPath);
	const anchorIndex = anchor === null ? -1 : visiblePaths.indexOf(anchor);

	if (modifiers.shift) {
		if (anchorIndex !== -1 && clickedIndex !== -1) {
			const start = Math.min(anchorIndex, clickedIndex);
			const end = Math.max(anchorIndex, clickedIndex);
			const range = visiblePaths.slice(start, end + 1);

			return {
				selected: modifiers.ctrl ? new Set([...currentSelection, ...range]) : new Set(range),
				anchor
			};
		}

		return {
			selected: modifiers.ctrl ? new Set([...currentSelection, clickedPath]) : new Set([clickedPath]),
			anchor: clickedPath
		};
	}

	if (modifiers.ctrl) {
		const selected = new Set(currentSelection);
		if (selected.has(clickedPath)) {
			selected.delete(clickedPath);
		} else {
			selected.add(clickedPath);
		}

		return {
			selected,
			anchor: clickedPath
		};
	}

	return {
		selected: new Set([clickedPath]),
		anchor: clickedPath
	};
}
