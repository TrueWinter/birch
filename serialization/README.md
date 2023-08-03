This directory contains the (de)serialization code for BSS (Birch Saved Search) files.

## v1

BSS v1 was simply base64 encoded JSON (see interface below). Due to it's inefficiency, it was quickly replaced.

```js
interface SavedSearch {
	mode: 'all' | 'any'
	type: 'include' | 'exclude'
	terms: (string | SavedSearch)[]
}
```

## v2

BSS v2 represents the same data as v1, but in a binary format being around 60% smaller. `v2.hexpat` contains the file structure, and can be opened with [ImHex](https://github.com/WerWolv/ImHex).