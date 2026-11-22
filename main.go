package main

import (
	"crypto/rand"
	"embed"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"os/user"
	"path/filepath"
	"time"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed all:frontend/dist
var assets embed.FS

type Instance struct {
	// Explicitly setting the JSON keys is required for Wails
	// to add this struct to the TypeScript definition file
	ID                 string `json:"ID"`
	Name               string `json:"Name"`
	MinecraftDirectory string `json:"MinecraftDirectory"`
	DefaultSearch      string `json:"DefaultSearch"`
}

type BirchConfig struct {
	Instances      []Instance `json:"Instances"`
	ActiveInstance string     `json:"ActiveInstance"`

	IgnoreOldLogs   bool `json:"IgnoreOldLogs"`
	SkipUpdateCheck bool `json:"SkipUpdateCheck"`
	// Deprecated: This was replaced with BSS files stored in
	// $birchConfigDir/searches/
	SavedSearchQueries map[string]string `json:"SavedSearchQueries,omitempty"`

	// Deprecated: This was replaced by Instances
	MinecraftDirectory string `json:"MinecraftDirectory,omitempty"`
	// Deprecated: This was replaced by Instance.DefaultSearch
	DefaultSearch string `json:"DefaultSearch,omitempty"`
}

var config BirchConfig
var userAppdataDir string
var birchConfigDir string

func newInstanceID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}

	return hex.EncodeToString(b)
}

func newInstance(minecraftDir string) Instance {
	return Instance{
		ID:                 newInstanceID(),
		Name:               filepath.Base(minecraftDir),
		MinecraftDirectory: minecraftDir,
	}
}

func getActiveInstance() *Instance {
	if len(config.Instances) == 0 {
		return nil
	}

	for i := range config.Instances {
		if config.Instances[i].ID == config.ActiveInstance {
			return &config.Instances[i]
		}
	}

	return &config.Instances[0]
}

func ensureValidActiveInstance() bool {
	active := getActiveInstance()
	if active == nil {
		return false
	}

	if config.ActiveInstance != active.ID {
		config.ActiveInstance = active.ID
		return true
	}

	return false
}

func latestLogFileFor(minecraftDir string) string {
	return minecraftDir + sep() + "logs" + sep() + "latest.log"
}

// migrateConfig converts the old single-instance configuration into the
// multi-instance format. It returns true when the configuration was changed.
func migrateConfig(defaultMinecraftDir string) bool {
	changed := false

	if len(config.Instances) == 0 {
		minecraftDir := config.MinecraftDirectory
		if minecraftDir == "" {
			minecraftDir = defaultMinecraftDir
		}

		instance := newInstance(minecraftDir)
		instance.DefaultSearch = config.DefaultSearch
		config.Instances = []Instance{instance}
		config.ActiveInstance = instance.ID
		changed = true
	}

	if ensureValidActiveInstance() {
		changed = true
	}

	if config.MinecraftDirectory != "" || config.DefaultSearch != "" {
		config.MinecraftDirectory = ""
		config.DefaultSearch = ""
		changed = true
	}

	return changed
}

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
		BackgroundColour:         &options.RGBA{R: 0x33, G: 0x33, B: 0x33, A: 1},
		OnStartup:                app.startup,
		OnDomReady:               app.ready,
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
	ioutil.WriteFile(birchConfigDir+sep()+"config.json", file, os.ModePerm)
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

	minecraftDir := getMinecraftDir(userHomeDir)
	if !exists(birchConfigDir + sep() + "config.json") {
		instance := newInstance(minecraftDir)
		config.Instances = []Instance{instance}
		config.ActiveInstance = instance.ID

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

		if config.SavedSearchQueries == nil {
			config.SavedSearchQueries = make(map[string]string)
		}

		if migrateConfig(minecraftDir) {
			SaveConfig()
		}
	}

	app := NewApp()
	ui(app)
}
