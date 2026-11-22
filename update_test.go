package main

import (
	"testing"

	"golang.org/x/mod/semver"
)

func TestIsVersionNewer(t *testing.T) {
	tests := []struct {
		name       string
		newVersion string
		oldVersion string
		want       bool
	}{
		{name: "newer patch", newVersion: "1.2.4", oldVersion: "1.2.3", want: true},
		{name: "newer major with v prefix", newVersion: "v2.0.0", oldVersion: "1.9.9", want: true},
		{name: "older patch", newVersion: "1.2.2", oldVersion: "1.2.3", want: false},
		{name: "equal version", newVersion: "1.2.3", oldVersion: "1.2.3", want: false},
		{name: "equal with v prefix", newVersion: "v1.2.3", oldVersion: "1.2.3", want: false},
		{name: "newer than prerelease", newVersion: "1.0.0", oldVersion: "1.0.0-beta.1", want: true},
		{name: "newer prerelease", newVersion: "1.0.0-beta.2", oldVersion: "1.0.0-beta.1", want: true},
		{name: "older than release", newVersion: "1.0.0-beta.1", oldVersion: "1.0.0", want: false},
		{name: "invalid new version", newVersion: "not-a-version", oldVersion: "1.0.0", want: false},
		{name: "invalid old version", newVersion: "2.0.0", oldVersion: "not-a-version", want: false},
		{name: "empty versions", newVersion: "", oldVersion: "", want: false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := isVersionNewer(tt.newVersion, tt.oldVersion); got != tt.want {
				t.Errorf("isVersionNewer(%q, %q) = %v, want %v", tt.newVersion, tt.oldVersion, got, tt.want)
			}
		})
	}
}

func TestNormalizeVersion(t *testing.T) {
	tests := map[string]string{
		"1.2.3":    "v1.2.3",
		"v1.2.3":   "v1.2.3",
		" v1.2.3 ": "v1.2.3",
		"":         "",
	}

	for input, want := range tests {
		if got := normalizeVersion(input); got != want {
			t.Errorf("normalizeVersion(%q) = %q, want %q", input, got, want)
		}
	}
}

func TestAppVersionIsValid(t *testing.T) {
	version := appVersion()
	if version == "" {
		t.Fatal("expected an application version")
	}

	if !semver.IsValid(normalizeVersion(version)) {
		t.Errorf("expected a valid semantic version, got %q", version)
	}
}
