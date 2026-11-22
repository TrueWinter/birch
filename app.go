package main

import (
	"birch/serialization"
	"bufio"
	"compress/gzip"
	"context"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	goruntime "runtime"
	"strings"
	"sync"
	"time"

	"golang.org/x/text/transform"

	"github.com/radovskyb/watcher"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx         context.Context
	mutex       sync.Mutex
	watcher     *watcher.Watcher
	watcherDone chan struct{}
}

var fileSize *int64
var linesCount *int
var didDoInitialLogIgnore bool
var shouldLoadLog bool
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

	if active := getActiveInstance(); active != nil {
		fileToLoad = latestLogFileFor(active.MinecraftDirectory)
	}
}

func (a *App) activeMinecraftDir() string {
	a.mutex.Lock()
	defer a.mutex.Unlock()

	if active := getActiveInstance(); active != nil {
		return active.MinecraftDirectory
	}

	return ""
}

func (a *App) stopWatchingLocked() {
	if a.watcherDone != nil {
		close(a.watcherDone)
		a.watcherDone = nil
	}

	a.watcher = nil
}

func (a *App) startWatchingLocked() {
	a.startWatchingLockedWith(false)
}

// startWatchingLockedWith sets up the watcher while the caller holds a.mutex.
// existingContentIsNew is set when latest.log was created after the current
// instance was selected, so its contents must not be discarded by the
// IgnoreOldLogs pass.
func (a *App) startWatchingLockedWith(existingContentIsNew bool) {
	a.stopWatchingLocked()

	if fileSize == nil {
		fileSize = new(int64)
	}

	if linesCount == nil {
		linesCount = new(int)
	}

	active := getActiveInstance()
	if active == nil {
		runtime.EventsEmit(a.ctx, "error", "No Minecraft instance is configured")
		return
	}

	latestLogFile := latestLogFileFor(active.MinecraftDirectory)
	fileToLoad = latestLogFile
	didDoInitialLogIgnore = existingContentIsNew
	shouldLoadLog = true
	*fileSize = 0
	*linesCount = 0

	runtime.WindowSetTitle(a.ctx, "Birch")

	latestLogPath, err := filepath.Abs(latestLogFile)
	if err != nil {
		latestLogPath = latestLogFile
	}
	latestLogPath = filepath.Clean(latestLogPath)

	watchPath := latestLogFile
	watchDirectory := false
	if _, statErr := os.Stat(latestLogFile); statErr != nil {
		// The log does not exist yet. Watch the logs directory until it
		// appears; anything created from now on belongs to this selection.
		didDoInitialLogIgnore = true
		watchPath = filepath.Dir(latestLogFile)
		watchDirectory = true
	}

	newWatcher := watcher.New()
	if watchDirectory {
		newWatcher.FilterOps(watcher.Write, watcher.Create)
	} else {
		newWatcher.FilterOps(watcher.Write)
	}

	// Add before starting any goroutines so a missing path does not
	// leave an event loop waiting forever for the watcher to close.
	if err := newWatcher.Add(watchPath); err != nil {
		kind := "latest log file"
		if watchDirectory {
			kind = "logs directory"
		}

		msg := "Failed to open " + kind + ": " + err.Error()
		log.Println(msg)
		runtime.EventsEmit(a.ctx, "error", msg)
		return
	}

	done := make(chan struct{})
	a.watcher = newWatcher
	a.watcherDone = done

	var promoteOnce sync.Once

	go func() {
		for {
			select {
			case event := <-newWatcher.Event:
				if filepath.Clean(event.Path) != latestLogPath {
					continue
				}

				if watchDirectory {
					// Wait until the newly created log actually has content
					// before switching away from the directory watcher.
					info, statErr := os.Stat(latestLogFile)
					if statErr != nil || info.Size() == 0 {
						continue
					}

					promoted := false
					promoteOnce.Do(func() {
						promoted = a.promoteToFileWatcher(newWatcher)
					})
					if !promoted {
						continue
					}
				}

				log.Println(event)
				runtime.EventsEmit(a.ctx, "changed")
			case err := <-newWatcher.Error:
				log.Println("Failed to check for changes in latest log file: " + err.Error())
			case <-newWatcher.Closed:
				return
			}
		}
	}()

	go func() {
		if err := newWatcher.Start(time.Millisecond * 1000); err != nil {
			log.Println("Failed to check for changes in latest log file: " + err.Error())
			runtime.EventsEmit(a.ctx, "error", "Failed to check for changes in latest log file: "+err.Error())
		}
	}()

	// Wait for Start to begin before closing; watcher.Close is a no-op
	// when called before the watcher is running.
	go func() {
		<-done
		newWatcher.Wait()
		newWatcher.Close()
	}()
}

func (a *App) promoteToFileWatcher(oldWatcher *watcher.Watcher) bool {
	a.mutex.Lock()
	defer a.mutex.Unlock()

	// Ignore stale promotions from a watcher that has already been replaced.
	if a.watcher != oldWatcher {
		return false
	}

	a.startWatchingLockedWith(true)
	return true
}

func (a *App) startWatching() {
	a.mutex.Lock()
	defer a.mutex.Unlock()
	a.startWatchingLocked()
}

func (a *App) ready(ctx context.Context) {
	a.startWatching()

	if !config.SkipUpdateCheck {
		runtime.EventsEmit(ctx, "updateCheck")
	}

	if len(config.SavedSearchQueries) != 0 {
		log.Println("Found legacy SavedSearchQueries. Converting to BSS files")

		a.mutex.Lock()
		for name, data := range config.SavedSearchQueries {
			log.Println(name, data)
			ds, dsErr := serialization.Deserialize([]byte(data))
			if dsErr != nil {
				log.Println("Failed to migrate saved search "+name, dsErr)
				continue
			}

			err := a.SaveDeserializedSearchToBirchDirectory(name, ds)
			if err != nil {
				log.Println("Failed to migrate saved search "+name, err)
			} else {
				delete(config.SavedSearchQueries, name)
			}
		}

		SaveConfig()
		a.mutex.Unlock()
	}
}

func (a *App) LoadLog(shouldDelete bool) {
	a.mutex.Lock()
	defer a.mutex.Unlock()
	a.loadLog(shouldDelete)
}

func (a *App) loadLog(shouldDelete bool) {
	if !shouldLoadLog {
		return
	}

	log.Println("Loading log")
	file, err := os.Open(fileToLoad)
	if err != nil {
		if os.IsNotExist(err) {
			// The log has not been created yet (e.g. the game has not been
			// launched for this instance). The watcher will notify us once it
			// appears, so this is not an error worth surfacing.
			log.Println("Latest log file does not exist yet: " + err.Error())
			return
		}

		log.Println("Failed to read log file: " + err.Error())
		runtime.EventsEmit(a.ctx, "error", "Failed to read log file: "+err.Error())
		return
	}
	defer file.Close()

	lastFileSize := *fileSize
	s, err := file.Stat()
	if err != nil {
		log.Println("Failed to check log size: " + err.Error())
		runtime.EventsEmit(a.ctx, "error", "Failed to check log size: "+err.Error())
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

	// Complete the initial ignore pass even when the log currently
	// contains no chat lines, otherwise the first chat line written
	// afterwards would be discarded (and never reloaded).
	if config.IgnoreOldLogs && !didDoInitialLogIgnore {
		newLogs = []string{}
		didDoInitialLogIgnore = true
	}

	// If no chat logs changed (often happens when a warning/error
	// gets logged by Minecraft), don't do anything else.
	if *linesCount == 0 {
		return
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
	a.mutex.Lock()
	defer a.mutex.Unlock()

	out := config
	out.Instances = append([]Instance(nil), config.Instances...)
	if config.SavedSearchQueries != nil {
		out.SavedSearchQueries = make(map[string]string, len(config.SavedSearchQueries))
		for k, v := range config.SavedSearchQueries {
			out.SavedSearchQueries[k] = v
		}
	}
	return out
}

func (a *App) ChangeSetting(setting string, data interface{}) {
	a.mutex.Lock()

	switch setting {
	case "IgnoreOldLogs":
		t, ok := data.(bool)
		if ok {
			config.IgnoreOldLogs = t
			SaveConfig()
		}
	case "SkipUpdateCheck":
		t, ok := data.(bool)
		if ok {
			config.SkipUpdateCheck = t
			SaveConfig()
		}
	}

	shouldLoadLog = false
	a.mutex.Unlock()

	runtime.EventsEmit(a.ctx, "settingsChanged")
	runtime.EventsEmit(a.ctx, "message", "Settings changed, please restart Birch")
}

func findInstanceIndex(id string) int {
	for i := range config.Instances {
		if config.Instances[i].ID == id {
			return i
		}
	}

	return -1
}

func normalizeInstanceDir(dir string) string {
	cleaned := filepath.Clean(dir)
	if goruntime.GOOS == "windows" {
		return strings.ToLower(cleaned)
	}

	return cleaned
}

func instanceUsesDirectory(dir string, excludeID string) bool {
	normalized := normalizeInstanceDir(dir)

	for i := range config.Instances {
		if config.Instances[i].ID == excludeID {
			continue
		}

		if normalizeInstanceDir(config.Instances[i].MinecraftDirectory) == normalized {
			return true
		}
	}

	return false
}

func (a *App) AddInstance() (Instance, error) {
	dialogOptions := runtime.OpenDialogOptions{
		DefaultDirectory: userAppdataDir,
		Title:            "Select your Minecraft installation folder (not your logs folder)",
	}

	dir, err := runtime.OpenDirectoryDialog(a.ctx, dialogOptions)
	if err != nil {
		return Instance{}, err
	}

	if dir == "" {
		return Instance{}, errors.New("no folder selected")
	}

	instance := newInstance(dir)

	a.mutex.Lock()
	if instanceUsesDirectory(dir, "") {
		a.mutex.Unlock()
		return Instance{}, errors.New("this folder is already used by another instance")
	}

	config.Instances = append(config.Instances, instance)
	SaveConfig()
	a.mutex.Unlock()

	runtime.EventsEmit(a.ctx, "settingsChanged")
	return instance, nil
}

func (a *App) RemoveInstance(id string) error {
	a.mutex.Lock()

	index := findInstanceIndex(id)
	if index == -1 {
		a.mutex.Unlock()
		return errors.New("instance not found")
	}

	if len(config.Instances) == 1 {
		a.mutex.Unlock()
		return errors.New("cannot remove the only instance")
	}

	wasActive := config.ActiveInstance == id
	config.Instances = append(config.Instances[:index], config.Instances[index+1:]...)

	active := getActiveInstance()
	var activeCopy Instance
	if active != nil {
		activeCopy = *active
	}

	if wasActive {
		config.ActiveInstance = activeCopy.ID
		SaveConfig()
		runtime.EventsEmit(a.ctx, "instanceChanged", activeCopy)
		a.startWatchingLocked()
	} else {
		SaveConfig()
	}

	a.mutex.Unlock()

	runtime.EventsEmit(a.ctx, "settingsChanged")
	return nil
}

func (a *App) SetInstanceName(id string, name string) error {
	name = strings.TrimSpace(name)

	a.mutex.Lock()
	index := findInstanceIndex(id)
	if index == -1 {
		a.mutex.Unlock()
		return errors.New("instance not found")
	}

	if name == "" {
		name = filepath.Base(config.Instances[index].MinecraftDirectory)
	}

	config.Instances[index].Name = name
	SaveConfig()
	a.mutex.Unlock()

	runtime.EventsEmit(a.ctx, "settingsChanged")
	return nil
}

func (a *App) SetInstanceDirectory(id string) error {
	dialogOptions := runtime.OpenDialogOptions{
		DefaultDirectory: userAppdataDir,
		Title:            "Select your Minecraft installation folder (not your logs folder)",
	}

	dir, err := runtime.OpenDirectoryDialog(a.ctx, dialogOptions)
	if err != nil {
		return err
	}

	if dir == "" {
		return errors.New("no folder selected")
	}

	a.mutex.Lock()
	index := findInstanceIndex(id)
	if index == -1 {
		a.mutex.Unlock()
		return errors.New("instance not found")
	}

	if instanceUsesDirectory(dir, id) {
		a.mutex.Unlock()
		return errors.New("this folder is already used by another instance")
	}

	config.Instances[index].MinecraftDirectory = dir
	wasActive := config.ActiveInstance == id

	SaveConfig()
	if wasActive {
		runtime.EventsEmit(a.ctx, "instanceChanged", config.Instances[index])
		a.startWatchingLocked()
	}
	a.mutex.Unlock()

	runtime.EventsEmit(a.ctx, "settingsChanged")
	return nil
}

func (a *App) SetInstanceDefaultSearch(id string, search string) error {
	a.mutex.Lock()
	index := findInstanceIndex(id)
	if index == -1 {
		a.mutex.Unlock()
		return errors.New("instance not found")
	}

	config.Instances[index].DefaultSearch = search
	SaveConfig()
	a.mutex.Unlock()

	runtime.EventsEmit(a.ctx, "settingsChanged")
	return nil
}

func (a *App) SwitchInstance(id string) error {
	a.mutex.Lock()

	index := findInstanceIndex(id)
	if index == -1 {
		a.mutex.Unlock()
		return errors.New("instance not found")
	}

	config.ActiveInstance = id
	SaveConfig()
	instance := config.Instances[index]
	runtime.EventsEmit(a.ctx, "instanceChanged", instance)
	a.startWatchingLocked()
	a.mutex.Unlock()

	return nil
}

func (a *App) loadLogFile(file string, filename string, delete bool) {
	a.mutex.Lock()
	fileToLoad = file
	didDoInitialLogIgnore = true
	*fileSize = 0
	*linesCount = 0
	shouldLoadLog = true
	a.stopWatchingLocked()

	a.loadLog(delete)
	a.mutex.Unlock()

	runtime.EventsEmit(a.ctx, "nonLatestFileLoaded")
	runtime.WindowSetTitle(a.ctx, "Birch: "+filename)
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

func (a *App) OpenLogFileWithName(file string) {
	runtime.EventsEmit(a.ctx, "setLoadStatus", true)
	runtime.EventsEmit(a.ctx, "logFileSelected")

	if strings.HasSuffix(file, ".log.gz") {
		log.Println(".log.gz", file)
		log, err := a.unzip(file)
		if err != nil {
			runtime.EventsEmit(a.ctx, "error", "Failed to load log: "+err.Error(), true)
			return
		}
		a.loadLogFile(log, filepath.Base(file), true)
	} else if strings.HasSuffix(file, ".log") {
		log.Println(".log", file)
		a.loadLogFile(file, filepath.Base(file), false)
	} else {
		runtime.EventsEmit(a.ctx, "error", "Failed to get selected file: file type not supported", true)
	}
}

func (a *App) OpenLogFile() {
	dialogOptions := runtime.OpenDialogOptions{
		DefaultDirectory: a.activeMinecraftDir() + sep() + "logs",
		Title:            "Select the log file",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Log files",
				Pattern:     "*.log;*.log.gz",
			},
		},
	}

	file, err := runtime.OpenFileDialog(a.ctx, dialogOptions)
	if err != nil || file == "" {
		if err != nil {
			runtime.EventsEmit(a.ctx, "error", "Failed to get selected file: "+err.Error(), true)
		}

		return
	}

	a.OpenLogFileWithName(file)
}

type LogFiles struct {
	Name string `json:"Name"`
	Path string `json:"Path"`
}

func (a *App) GetFilesInLogDirectory() ([]LogFiles, error) {
	logDir := a.activeMinecraftDir() + sep() + "logs"

	files, err := os.ReadDir(logDir)
	if err != nil {
		return nil, err
	}

	logFiles := []LogFiles{}

	for _, file := range files {
		if file.IsDir() {
			continue
		}

		if strings.HasSuffix(file.Name(), ".log") || strings.HasSuffix(file.Name(), ".log.gz") {
			logFiles = append(logFiles, LogFiles{
				Name: file.Name(),
				Path: logDir + sep() + file.Name(),
			})
		}
	}

	log.Printf("Found %d log files", len(logFiles))
	return logFiles, nil
}

func (a *App) GetSavedSearches() ([]NamedSearch, error) {
	searchDir := birchConfigDir + sep() + "searches"

	files, err := os.ReadDir(searchDir)
	if err != nil {
		if os.IsNotExist(err) {
			return []NamedSearch{}, nil
		}

		return nil, err
	}

	searches := []NamedSearch{}

	for _, file := range files {
		if file.IsDir() {
			continue
		}

		searchFile, searchFileErr := os.ReadFile(searchDir + sep() + file.Name())
		if searchFileErr != nil {
			return []NamedSearch{}, searchFileErr
		}

		ds, dsErr := serialization.Deserialize(searchFile)
		if dsErr != nil {
			return []NamedSearch{}, dsErr
		}

		searches = append(searches, NamedSearch{
			Name: strings.Replace(file.Name(), filepath.Ext(file.Name()), "", 1),
			Data: ds,
		})
	}

	log.Printf("Found %d searches", len(searches))
	return searches, nil
}

func (a *App) saveSerializedSearch(file string, data []byte) error {
	saveFile, saveErr := os.Create(file)
	if saveErr != nil {
		return saveErr
	}
	defer saveFile.Close()

	saveFile.Write(data)
	return nil
}

func (a *App) ExportSearch(file string, name string, data string) error {
	savedSearch := serialization.DSearchGroup{}
	marshalErr := json.Unmarshal([]byte(data), &savedSearch)
	if marshalErr != nil {
		return marshalErr
	}

	serialized, serializeErr := serialization.Serialize(savedSearch)
	if serializeErr != nil {
		return serializeErr
	}

	return a.saveSerializedSearch(file, serialized)
}

func (a *App) ExportSearchWithDialog(name string, data string) error {
	dialogOptions := runtime.SaveDialogOptions{
		DefaultFilename: name + ".bss",
	}

	file, err := runtime.SaveFileDialog(a.ctx, dialogOptions)
	if err != nil || file == "" {
		if err != nil {
			return err
		}

		return nil
	}

	return a.ExportSearch(file, name, data)
}

func (a *App) SaveDeserializedSearchToBirchDirectory(name string, data serialization.DSearchGroup) error {
	saveDir := birchConfigDir + sep() + "searches"
	if !exists(saveDir) {
		os.Mkdir(saveDir, os.ModePerm)
	}

	serialized, serializeErr := serialization.Serialize(data)
	if serializeErr != nil {
		return serializeErr
	}

	file := saveDir + sep() + name + ".bss"
	return a.saveSerializedSearch(file, serialized)
}

func (a *App) SaveSearchToBirchDirectory(name string, data string) error {
	saveDir := birchConfigDir + sep() + "searches"
	if !exists(saveDir) {
		os.Mkdir(saveDir, os.ModePerm)
	}
	file := saveDir + sep() + name + ".bss"
	return a.ExportSearch(file, name, data)
}

func (a *App) DeleteSavedSearch(name string) error {
	a.mutex.Lock()

	save := birchConfigDir + sep() + "searches" + sep() + name + ".bss"
	if exists(save) {
		if err := os.Remove(save); err != nil {
			a.mutex.Unlock()
			return err
		}
	}

	changed := false
	for i := range config.Instances {
		if config.Instances[i].DefaultSearch == name {
			config.Instances[i].DefaultSearch = ""
			changed = true
		}
	}

	if changed {
		SaveConfig()
	}

	a.mutex.Unlock()

	if changed {
		runtime.EventsEmit(a.ctx, "settingsChanged")
	}

	return nil
}

type NamedSearch struct {
	Name string                     `json:"name"`
	Data serialization.DSearchGroup `json:"data"`
}

func (a *App) ImportSearch() (NamedSearch, error) {
	dialogOptions := runtime.OpenDialogOptions{
		Title: "Open saved search",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Saved searches",
				Pattern:     "*.bss",
			},
		},
	}

	file, err := runtime.OpenFileDialog(a.ctx, dialogOptions)
	if err != nil || file == "" {
		if err != nil {
			return NamedSearch{}, err
		}

		return NamedSearch{}, errors.New("no file selected")
	}

	openFile, openErr := os.Open(file)
	if openErr != nil {
		return NamedSearch{}, openErr
	}
	defer openFile.Close()

	fileData, readErr := io.ReadAll(openFile)
	if readErr != nil {
		return NamedSearch{}, readErr
	}

	ds, dsErr := serialization.Deserialize(fileData)
	if dsErr != nil {
		return NamedSearch{}, dsErr
	}
	filename := filepath.Base(file)
	return NamedSearch{
		Name: strings.Replace(filename, filepath.Ext(filename), "", 1),
		Data: ds,
	}, nil
}

type GithubAsset struct {
	Name        string `json:"name"`
	DownloadUrl string `json:"browser_download_url"`
}

func findAppropriateAsset(assets []GithubAsset) (GithubAsset, error) {
	for _, asset := range assets {
		if isWindows() && strings.HasSuffix(asset.Name, ".exe") {
			return asset, nil
		} else if isMac() && strings.HasSuffix(asset.Name, ".pkg") {
			return asset, nil
		}
	}

	return GithubAsset{}, errors.New("no suitable binary found")
}

func (a *App) DownloadUpdate(assets []GithubAsset) (string, error) {
	asset, assetError := findAppropriateAsset(assets)
	if assetError != nil {
		return "", assetError
	}

	tempDir := os.TempDir()
	tempFile, tempFileErr := os.Create(tempDir + sep() + asset.Name)
	if tempFileErr != nil {
		return "", tempFileErr
	}
	defer tempFile.Close()

	resp, err := http.Get(asset.DownloadUrl)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	n, err := io.Copy(tempFile, resp.Body)
	if err != nil {
		return "", err
	}

	if n == 0 {
		return "", errors.New("received blank file")
	}

	tempFile.Chmod(0766)

	return tempFile.Name(), nil
}

func (a *App) InstallUpdate(file string) error {
	log.Println("Installing", file, "as requested by user")

	var cmd *exec.Cmd
	if isWindows() {
		// Running it with cmd allows the UAC popup to show
		cmd = exec.Command("cmd", "/c", file)
	} else {
		cmd = exec.Command("open", file)
	}
	cmdErr := cmd.Start()
	if cmdErr != nil {
		return cmdErr
	}

	releaseErr := cmd.Process.Release()
	if releaseErr != nil {
		return releaseErr
	}

	runtime.Quit(a.ctx)
	return nil
}

func (a *App) AlertMessage(title string, str string) {
	runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
		Type:    runtime.InfoDialog,
		Title:   title,
		Message: str,
	})
}
