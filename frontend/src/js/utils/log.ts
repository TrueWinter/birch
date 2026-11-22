export function bracketFix(str: string) {
	// See log event for reason
	return str.startsWith('[') || str.length == 0 ?
	str : `[${str}`
}

export function splitLogChunk(d: string): string[] {
	// Some log lines have multiple lines, so this is needed to split them properly
	return d.split('\n[').map(bracketFix);
}
