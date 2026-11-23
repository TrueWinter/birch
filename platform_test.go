package main

import (
	"runtime"
	"testing"

	"golang.org/x/text/encoding/charmap"
	"golang.org/x/text/encoding/unicode"
)

func TestDirectoryHelpers(t *testing.T) {
	home := "/home/test"

	var expectedAppData string
	var expectedConfig string
	var expectedMinecraft string
	var expectedSep string

	switch runtime.GOOS {
	case "windows":
		expectedAppData = home + "\\AppData\\Roaming"
		expectedConfig = expectedAppData + "\\TrueWinter\\Birch"
		expectedMinecraft = expectedAppData + "\\.minecraft"
		expectedSep = "\\"
	case "darwin":
		expectedAppData = home + "/Library/Application Support"
		expectedConfig = expectedAppData + "/TrueWinter/Birch"
		expectedMinecraft = expectedAppData + "/minecraft"
		expectedSep = "/"
	case "linux":
		expectedAppData = home + "/.local/share"
		expectedConfig = expectedAppData + "/TrueWinter/Birch"
		expectedMinecraft = home + "/.minecraft"
		expectedSep = "/"
	default:
		t.Skipf("unsupported platform: %s", runtime.GOOS)
	}

	if got := getAppDataDir(home); got != expectedAppData {
		t.Errorf("getAppDataDir(%q) = %q, want %q", home, got, expectedAppData)
	}

	if got := getConfigDir(home); got != expectedConfig {
		t.Errorf("getConfigDir(%q) = %q, want %q", home, got, expectedConfig)
	}

	if got := getMinecraftDir(home); got != expectedMinecraft {
		t.Errorf("getMinecraftDir(%q) = %q, want %q", home, got, expectedMinecraft)
	}

	if got := sep(); got != expectedSep {
		t.Errorf("sep() = %q, want %q", got, expectedSep)
	}
}

func TestGetCharMap(t *testing.T) {
	expected := unicode.UTF8
	if isWindows() {
		expected = charmap.ISO8859_1
	}

	if got := getCharMap(); got != expected {
		t.Errorf("getCharMap() = %v, want %v", got, expected)
	}
}

func TestFindAppropriateAsset(t *testing.T) {
	assets := []GithubAsset{
		{Name: "Birch.exe"},
		{Name: "Birch.pkg"},
		{Name: "Birch.AppImage"},
		{Name: "notes.txt"},
	}

	var expected string
	switch runtime.GOOS {
	case "windows":
		expected = "Birch.exe"
	case "darwin":
		expected = "Birch.pkg"
	case "linux":
		expected = "Birch.AppImage"
	default:
		t.Skipf("unsupported platform: %s", runtime.GOOS)
	}

	asset, err := findAppropriateAsset(assets)
	if err != nil {
		t.Fatalf("findAppropriateAsset failed: %v", err)
	}

	if asset.Name != expected {
		t.Errorf("expected %q, got %q", expected, asset.Name)
	}

	if _, err := findAppropriateAsset([]GithubAsset{{Name: "notes.txt"}}); err == nil {
		t.Error("expected an error when no suitable asset exists")
	}
}
