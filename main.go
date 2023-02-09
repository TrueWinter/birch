package main

import (
	"embed"
	"encoding/json"
	"io/ioutil"
	"log"
	"os"
	"os/user"

	//"sync"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

type BirchConfig struct {
	MinecraftDirectory string
}

var config BirchConfig
var latestLogFile string
var userAppdataDir string
var birchConfigDir string

func ui(app *App) {
	err := wails.Run(&options.App{
		Title:  "Birch",
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		Windows: &windows.Options{
			WebviewUserDataPath: birchConfigDir + "\\wv2",
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup: app.startup,
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
		ioutil.WriteFile(birchConfigDir + "\\config.json", file, os.ModePerm)
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

	userAppdataDir = userHomeDir + "\\AppData\\Roaming";
	birchConfigDir = userAppdataDir + "\\TrueWinter\\Birch";
	if (!exists(userAppdataDir + "\\TrueWinter")) {
		os.MkdirAll(birchConfigDir, os.ModePerm)
	}

	if (!exists(birchConfigDir + "\\config.json")) {
		minecraftDir := userAppdataDir + "\\.minecraft";
		config.MinecraftDirectory = minecraftDir

		SaveConfig();
	} else {
		configFile, err := ioutil.ReadFile(birchConfigDir + "\\config.json")
		if err != nil {
			log.Fatal(err.Error())
		}

		err = json.Unmarshal(configFile, &config)
		if err != nil {
			log.Fatal(err.Error())
		}
	}

	latestLogFile = config.MinecraftDirectory + "\\logs\\latest.log"

	app := NewApp()
	ui(app)
}
