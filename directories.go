package main

import (
	"runtime"
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
