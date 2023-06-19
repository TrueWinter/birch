package main

import (
	"bufio"
	"compress/gzip"
	"context"
	"io"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

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
var w *watcher.Watcher
var fileToLoad string

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
	fileToLoad = latestLogFile
}

func (a *App) ready(ctx context.Context) {
	if w != nil {
		return
	}

	w = watcher.New()
	w.FilterOps(watcher.Write)

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

func (a *App) LoadLog(shouldDelete bool) {
	if !shouldLoadLog {
		return
	}

	log.Println("Loading log")
	file, err := os.Open(fileToLoad)
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

	reader := transform.NewReader(file, getCharMap().NewDecoder())
	scanner := bufio.NewScanner(reader)
	newLogs := []string{}

	for scanner.Scan() {
		line := scanner.Text()

		if strings.Contains(line, "[CHAT]") {
			newLogs = append(newLogs, line)
		}
	}

	*linesCount = len(newLogs)

	runtime.EventsEmit(a.ctx, "setLoadStatus", false)

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

	if shouldDelete && strings.HasPrefix(fileToLoad, os.TempDir()) {
		file.Close()
		log.Println("Will delete " + fileToLoad)
		err := os.Remove(fileToLoad)
		if err != nil {
			log.Println("Failed to remove temporary file", err.Error())
		}
	}
}

func (a *App) GetSettings() BirchConfig {
	return config
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

type SettingData struct {
	Key string `json:"key"`
	Value string `json:"value"`
}

func (a *App) ChangeSetting(setting string, data SettingData) {
	skipReload := false

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
		case "SavedSearchQueries":
			println("search", data.Key, data.Value)
			if data.Value == "" {
				delete(config.SavedSearchQueries, data.Key)
			} else {
				config.SavedSearchQueries[data.Key] = data.Value
			}
			SaveConfig()
			skipReload = true
			runtime.EventsEmit(a.ctx, "savedSearchQueries")
	}

	if !skipReload {
		runtime.EventsEmit(a.ctx, "settingsChanged")
		runtime.EventsEmit(a.ctx, "message", "Settings changed, please restart Birch")
		shouldLoadLog = false
	}
}

func (a *App) loadLogFile(file string, filename string, delete bool) {
	fileToLoad = file
	didDoInitialLogIgnore = true
	*fileSize = 0
	*linesCount = 0
	shouldLoadLog = true
	if w != nil {
		w.Close()
	}

	a.LoadLog(delete)
	runtime.EventsEmit(a.ctx, "nonLatestFileLoaded")
	runtime.WindowSetTitle(a.ctx, "Birch: " + filename)
}

func (a *App) unzip(f string) (string, error) {
	file, err := os.Open(f)
	if err != nil {
		return "", err
	}
	defer file.Close()

	gz, gzErr := gzip.NewReader(file)
	if gzErr != nil {
		return "", err
	}
	gz.Close()

	tempDir := os.TempDir()
	tempFile, tempFileErr := os.CreateTemp(tempDir, "birch-*.log")
	if tempFileErr != nil {
		return "", tempFileErr
	}

	io.Copy(tempFile, gz)
	tempFile.Close()
	return tempFile.Name(), nil
}

func (a *App) OpenLogFile() {
	dialogOptions := runtime.OpenDialogOptions{
		DefaultDirectory: config.MinecraftDirectory + sep() + "logs",
		Title: "Select the log file",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Log files",
				Pattern: "*.log;*.log.gz",
			},
		},
	}

	file, err := runtime.OpenFileDialog(a.ctx, dialogOptions)
	if err != nil || file == "" {
		if err != nil {
			runtime.EventsEmit(a.ctx, "error", "Failed to get selected file: " + err.Error(), true)
		}

		return
	}

	runtime.EventsEmit(a.ctx, "setLoadStatus", true)
	runtime.EventsEmit(a.ctx, "logFileSelected")

	if (strings.HasSuffix(file, ".log.gz")) {
		log.Println(".log.gz", file)
		log, err := a.unzip(file)
		if err != nil {
			runtime.EventsEmit(a.ctx, "error", "Failed to load log: " + err.Error(), true)
			return
		}
		a.loadLogFile(log, filepath.Base(file), true)
	} else if (strings.HasSuffix(file, ".log")) {
		log.Println(".log", file)
		a.loadLogFile(file, filepath.Base(file), false)
	} else {
		runtime.EventsEmit(a.ctx, "error", "Failed to get selected file: file type not supported", true)
	}
}