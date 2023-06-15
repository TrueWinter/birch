package main

import (
	"runtime"

	"golang.org/x/text/encoding"
	"golang.org/x/text/encoding/charmap"
	"golang.org/x/text/encoding/unicode"
)

func getAppDataDir(userDir string) string {
	if isWindows() {
		return userDir + "\\AppData\\Roaming"
	} else if isMac() {
		return userDir + "/Library/Application Support"
	}

	panic("Birch only runs on Windows and Mac at this time")
}

func getConfigDir(userDir string) string {
	return getAppDataDir(userDir) + sep() + "TrueWinter" + sep() + "Birch"
}

func getMinecraftDir(userDir string) string {
	if isWindows() {
		return getAppDataDir(userDir) + "\\.minecraft"
	} else if isMac() {
		return getAppDataDir(userDir) + "/minecraft"
	}

	panic("Birch only runs on Windows and Mac at this time")
}

func isWindows() bool {
	return runtime.GOOS == "windows"
}

func isMac() bool {
	return runtime.GOOS == "darwin"
}

func sep() string {
	if isWindows() {
		return "\\"
	}

	return "/"
}

func getCharMap() encoding.Encoding {
	if isWindows() {
		return charmap.ISO8859_1
	} else if isMac() {
		return unicode.UTF8
	}

	panic("Birch only runs on Windows and Mac at this time")
}
