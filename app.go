package main

import (
	"bufio"
	"context"
	"encoding/json"
	"io"
	"log"
	"os"
	"strings"
	"time"

	"golang.org/x/text/encoding/charmap"
	"golang.org/x/text/transform"

	"github.com/radovskyb/watcher"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

var fileSize *int64
var linesCount *int
var didDoInitialLogIgnore bool
var shouldLoadLog bool
var hasWatcher bool

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	fileSize = new(int64)
	linesCount = new(int)
	didDoInitialLogIgnore = false
	shouldLoadLog = true
	hasWatcher = false
}

func (a *App) ready(ctx context.Context) {
	if hasWatcher {
		return
	}

	w := watcher.New()
	w.FilterOps(watcher.Write)
	hasWatcher = true

	go func () {
		for {
			select {
			case event := <-w.Event:
				log.Println(event)
				runtime.EventsEmit(ctx, "changed")
			case err := <-w.Error:
				log.Fatalln(err)
			case <-w.Closed:
				return
			}
		}
	}()

	go func() {
		didError := false
		if err := w.Add(latestLogFile); err != nil {
			log.Println("Failed to open latest log file: " + err.Error())
			runtime.EventsEmit(ctx, "error", "Failed to open latest log file: " + err.Error())
			didError = true
		}

		if didError {
			return
		}

		if err := w.Start(time.Millisecond * 1000); err != nil {
			log.Println("Failed to check for changes in latest log file: " + err.Error())
			runtime.EventsEmit(ctx, "error", "Failed to check for changes in latest log file: " + err.Error())
		}
	}()

	if (!config.SkipUpdateCheck) {
		runtime.EventsEmit(ctx, "updateCheck")
	}
}

func (a *App) LoadLog() {
	if !shouldLoadLog {
		return
	}

	log.Println("Loading log")
	file, err := os.Open(latestLogFile)
	if err != nil {
		log.Println("Failed to read log file: " + err.Error())
		runtime.EventsEmit(a.ctx, "error", "Failed to read log file: " + err.Error())
		return
	}
	defer file.Close()

	lastFileSize := *fileSize
	s, err := file.Stat()
	if err != nil {
		log.Println("Failed to check log size: " + err.Error())
		runtime.EventsEmit(a.ctx, "error", "Failed to check log size: " + err.Error())
		return
	}

	*fileSize = s.Size()
	if *fileSize < lastFileSize {
		log.Println("Log file rotated")
		lastFileSize = 0
	}
	// Only load what's changed since last time
	file.Seek(lastFileSize, io.SeekStart)

	reader := transform.NewReader(file, charmap.ISO8859_1.NewDecoder())
	scanner := bufio.NewScanner(reader)
	newLogs := []string{}

	for scanner.Scan() {
		line := scanner.Text()

		if strings.Contains(line, "[CHAT]") {
			newLogs = append(newLogs, line)
		}
	}

	*linesCount = len(newLogs)

	// If no chat logs changed (often happens when a warning/error
	// gets logged by Minecraft), don't do anything else.
	if *linesCount == 0 {
		return
	}

	if config.IgnoreOldLogs && !didDoInitialLogIgnore {
		newLogs = []string{}
		didDoInitialLogIgnore = true
	}

	log.Println("Emitting log")
	runtime.EventsEmit(a.ctx, "log", strings.Join(newLogs, "\n"))
}

func (a *App) GetSettings() string {
	data, _ := json.Marshal(config)
	return string(data)
}

func (a *App) BoolSettingChanged(setting string, value bool) {
	switch setting {
		case "IgnoreOldLogs":
			config.IgnoreOldLogs = value
		case "SkipUpdateCheck":
			config.SkipUpdateCheck = value;
	}

	SaveConfig()
	runtime.EventsEmit(a.ctx, "settingsChanged")
	runtime.EventsEmit(a.ctx, "message", "Settings changed, please restart Birch")
	shouldLoadLog = false
}

func (a *App) ChangeSetting(setting string) {
	switch setting {
		case "MinecraftDirectory":
			dialogOptions := runtime.OpenDialogOptions{
				DefaultDirectory: userAppdataDir,
				Title: "Select your Minecraft installation folder (not your logs folder)",
			}

			dir, err := runtime.OpenDirectoryDialog(a.ctx, dialogOptions)
			if err != nil || dir == "" {
				if err != nil {
					runtime.EventsEmit(a.ctx, "error", "Failed to get selected folder: " + err.Error())
				} else {
					runtime.EventsEmit(a.ctx, "error", "Failed to get selected folder")
				}

				return
			}

			config.MinecraftDirectory = dir
			SaveConfig()
	}

	runtime.EventsEmit(a.ctx, "settingsChanged")
	runtime.EventsEmit(a.ctx, "message", "Settings changed, please restart Birch")
	shouldLoadLog = false
}
