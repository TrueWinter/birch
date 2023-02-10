package main

import (
	"bufio"
	"context"
	"encoding/json"
	"log"
	"os"
	"strings"
	"time"

	"golang.org/x/text/transform"
	"golang.org/x/text/encoding/charmap"

	"github.com/radovskyb/watcher"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx context.Context
}

var fileSize *int64
var ignoreLines *int
var linesCount *int
var allPrevLogLines *[]string
var lastPrevLogLines *[]string

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	fileSize = new(int64)
	ignoreLines = new(int)
	linesCount = new(int)
	allPrevLogLines = new([]string)
	lastPrevLogLines = new([]string)

	w := watcher.New()
	w.FilterOps(watcher.Write)

	go func () {
		for {
			select {
			case event := <-w.Event:	
				log.Println(event) // Print the event's info.
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
}

func (a *App) LoadLog() {
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
		return;
	}

	*fileSize = s.Size()

	reader := transform.NewReader(file, charmap.ISO8859_1.NewDecoder())
	scanner := bufio.NewScanner(reader)
	lines := []string{}
	*linesCount = 0

	for scanner.Scan() {
		line := scanner.Text()

		if strings.Contains(line, "[CHAT]") {
			if *linesCount >= *ignoreLines {
				if !(config.IgnoreOldLogs && *ignoreLines == 0) {
					lines = append(lines, scanner.Text())
				}
			}
			*linesCount++
		}
	}

	if config.IgnoreOldLogs && *ignoreLines == 0 {
		*ignoreLines = *linesCount
	}

	if *fileSize < lastFileSize {
		*allPrevLogLines = append(*allPrevLogLines, *lastPrevLogLines...)
		log.Println("Log file rotated")
	}

	*lastPrevLogLines = lines
	lines = append(*allPrevLogLines, lines...)

	log.Println("Emitting log")
	runtime.EventsEmit(a.ctx, "log", strings.Join(lines, "\n"))
}

func (a *App) GetSettings() string {
	data, _ := json.Marshal(config)
	return string(data)
}

func (a *App) BoolSettingChanged(setting string, value bool) {
	switch setting {
		case "IgnoreOldLogs":
			config.IgnoreOldLogs = value
			break
	}

	SaveConfig()
	runtime.EventsEmit(a.ctx, "settingsChanged")
	runtime.EventsEmit(a.ctx, "message", "Settings changed, please restart Birch")
}

func (a *App) ChangeSetting(setting string) {
	switch setting {
		case "MinecraftDirectory":
			dialogOptions := runtime.OpenDialogOptions{
				DefaultDirectory: userAppdataDir,
				Title: "Select your Minecraft installation folder",
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

			break
	}

	runtime.EventsEmit(a.ctx, "settingsChanged")
	runtime.EventsEmit(a.ctx, "message", "Settings changed, please restart Birch")
}

func (a *App) ClearLogs() {
	*ignoreLines = *linesCount
	a.LoadLog()
}
