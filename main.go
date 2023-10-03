package main

import (
	"embed"
	"encoding/json"
	"io/ioutil"
	"log"
	"os"
	"os/user"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

type BirchConfig struct {
	// Explicitly setting the JSON key is required for Wails
	// to add this struct to the TypeScript definition file
	MinecraftDirectory string `json:"MinecraftDirectory"`
	IgnoreOldLogs      bool `json:"IgnoreOldLogs"`
	SkipUpdateCheck    bool `json:"SkipUpdateCheck"`
	// Deprecated: This was replaced with BSS files stored in
	// $birchConfigDir/searches/
	SavedSearchQueries map[string]string `json:"SavedSearchQueries,omitempty"`
	DefaultSearch string `json:"DefaultSearch"`
}

var config BirchConfig
var latestLogFile string
var userAppdataDir string
var birchConfigDir string

func ui(app *App) {
	err := wails.Run(&options.App{
		Title: "Birch",
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		Windows: &windows.Options{
			WebviewUserDataPath: birchConfigDir + "\\wv2",
		},
		EnableDefaultContextMenu: true,
		BackgroundColour: &options.RGBA{R: 0x33, G: 0x33, B: 0x33, A: 1},
		OnStartup:        app.startup,
		OnDomReady:       app.ready,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}

func exists(file string) bool {
	if _, err := os.Stat(file); err != nil {
		if os.IsNotExist(err) {
			return false
		}
	}

	return true
}

func SaveConfig() {
	file, _ := json.MarshalIndent(config, "", " ")
	ioutil.WriteFile(birchConfigDir + sep() + "config.json", file, os.ModePerm)
}

func main() {
	config = BirchConfig{}

	user, userErr := user.Current()
	if userErr != nil {
		log.Fatalf(userErr.Error())
	}

	userHomeDir := user.HomeDir
	if userHomeDir == "" {
		log.Fatalf("Failed to get user's home directory")
	}

	userAppdataDir = getAppDataDir(userHomeDir)
	birchConfigDir = getConfigDir(userHomeDir)
	if !exists(birchConfigDir) {
		os.MkdirAll(birchConfigDir, os.ModePerm)
	}

	if !exists(birchConfigDir + sep() + "config.json") {
		minecraftDir := getMinecraftDir(userHomeDir)
		config.MinecraftDirectory = minecraftDir

		SaveConfig()
	} else {
		configFile, err := ioutil.ReadFile(birchConfigDir + sep() + "config.json")
		if err != nil {
			log.Fatal(err.Error())
		}

		err = json.Unmarshal(configFile, &config)
		if err != nil {
			log.Fatal(err.Error())
		}

		if (config.SavedSearchQueries == nil) {
			config.SavedSearchQueries = make(map[string]string)
		}
	}

	latestLogFile = config.MinecraftDirectory + sep() + "logs" + sep() + "latest.log"

	app := NewApp()
	ui(app)
}
