package main

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.org/x/mod/semver"
)

//go:embed wails.json
var wailsConfigJSON []byte

const (
	githubLatestReleaseURL = "https://api.github.com/repos/TrueWinter/Birch/releases/latest"
	updateCheckTimeout     = 10 * time.Second
)

type Release struct {
	Assets  []GithubAsset `json:"assets"`
	TagName string        `json:"tag_name"`
	HTMLURL string        `json:"html_url"`
	Body    string        `json:"body"`
}

type wailsConfig struct {
	Info struct {
		ProductVersion string `json:"productVersion"`
	} `json:"info"`
}

func appVersion() string {
	var cfg wailsConfig
	if err := json.Unmarshal(wailsConfigJSON, &cfg); err != nil {
		log.Println("Failed to read application version:", err)
		return ""
	}

	return cfg.Info.ProductVersion
}

func normalizeVersion(version string) string {
	version = strings.TrimSpace(version)
	if version == "" {
		return ""
	}

	if !strings.HasPrefix(version, "v") {
		return "v" + version
	}

	return version
}

func isVersionNewer(newVersion string, oldVersion string) bool {
	newVersion = normalizeVersion(newVersion)
	oldVersion = normalizeVersion(oldVersion)

	if !semver.IsValid(newVersion) || !semver.IsValid(oldVersion) {
		return false
	}

	return semver.Compare(newVersion, oldVersion) > 0
}

func fetchLatestRelease() (Release, error) {
	req, err := http.NewRequest(http.MethodGet, githubLatestReleaseURL, nil)
	if err != nil {
		return Release{}, err
	}

	req.Header.Set("User-Agent", "Birch")
	req.Header.Set("Accept", "application/vnd.github+json")

	client := &http.Client{Timeout: updateCheckTimeout}
	resp, err := client.Do(req)
	if err != nil {
		return Release{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return Release{}, fmt.Errorf("unexpected response status: %s", resp.Status)
	}

	var release Release
	if err := json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(&release); err != nil {
		return Release{}, err
	}

	return release, nil
}

// CheckForUpdates fetches the latest release and notifies the frontend when it
// is newer than the running version.
func (a *App) CheckForUpdates() {
	if config.SkipUpdateCheck {
		return
	}

	go a.checkForUpdates()
}

func (a *App) checkForUpdates() {
	release, err := fetchLatestRelease()
	if err != nil {
		log.Println("Failed to check for updates:", err)
		return
	}

	if isVersionNewer(release.TagName, appVersion()) {
		runtime.EventsEmit(a.ctx, "updateAvailable", release)
	}
}
