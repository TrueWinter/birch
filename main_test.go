package main

import (
	"compress/gzip"
	"encoding/hex"
	"os"
	"path/filepath"
	"reflect"
	"strings"
	"testing"

	"birch/serialization"
)

func resetConfig(t *testing.T) {
	t.Helper()

	originalConfig := config
	originalConfigDir := birchConfigDir

	config = BirchConfig{}
	birchConfigDir = t.TempDir()

	t.Cleanup(func() {
		config = originalConfig
		birchConfigDir = originalConfigDir
	})
}

func TestMigrateConfig(t *testing.T) {
	t.Run("creates an instance from an empty config", func(t *testing.T) {
		resetConfig(t)

		changed := migrateConfig("/default/minecraft")

		if !changed {
			t.Fatal("expected config to change")
		}

		if len(config.Instances) != 1 {
			t.Fatalf("expected 1 instance, got %d", len(config.Instances))
		}

		instance := config.Instances[0]
		if instance.MinecraftDirectory != "/default/minecraft" {
			t.Errorf("unexpected directory: %q", instance.MinecraftDirectory)
		}

		if instance.ID == "" {
			t.Error("expected instance to have an ID")
		}

		if config.ActiveInstance != instance.ID {
			t.Errorf("expected active instance %q, got %q", instance.ID, config.ActiveInstance)
		}
	})

	t.Run("migrates legacy config fields", func(t *testing.T) {
		resetConfig(t)
		config.MinecraftDirectory = "/legacy/minecraft"
		config.DefaultSearch = "legacy-search"

		changed := migrateConfig("/default/minecraft")

		if !changed {
			t.Fatal("expected config to change")
		}

		if len(config.Instances) != 1 {
			t.Fatalf("expected 1 instance, got %d", len(config.Instances))
		}

		instance := config.Instances[0]
		if instance.MinecraftDirectory != "/legacy/minecraft" {
			t.Errorf("unexpected directory: %q", instance.MinecraftDirectory)
		}

		if instance.DefaultSearch != "legacy-search" {
			t.Errorf("unexpected default search: %q", instance.DefaultSearch)
		}

		if config.MinecraftDirectory != "" || config.DefaultSearch != "" {
			t.Error("expected legacy fields to be cleared")
		}
	})

	t.Run("fixes an invalid active instance", func(t *testing.T) {
		resetConfig(t)
		config.Instances = []Instance{
			{ID: "first", MinecraftDirectory: "/first"},
			{ID: "second", MinecraftDirectory: "/second"},
		}
		config.ActiveInstance = "missing"

		changed := migrateConfig("/default/minecraft")

		if !changed {
			t.Fatal("expected config to change")
		}

		if config.ActiveInstance != "first" {
			t.Errorf("expected active instance to fall back to first, got %q", config.ActiveInstance)
		}
	})

	t.Run("does nothing for a migrated config", func(t *testing.T) {
		resetConfig(t)
		config.Instances = []Instance{
			{ID: "first", MinecraftDirectory: "/first"},
		}
		config.ActiveInstance = "first"

		changed := migrateConfig("/default/minecraft")

		if changed {
			t.Fatal("expected config not to change")
		}
	})
}

func TestGetActiveInstance(t *testing.T) {
	resetConfig(t)

	if active := getActiveInstance(); active != nil {
		t.Fatalf("expected nil active instance, got %+v", active)
	}

	config.Instances = []Instance{
		{ID: "first", MinecraftDirectory: "/first"},
		{ID: "second", MinecraftDirectory: "/second"},
	}
	config.ActiveInstance = "second"

	if active := getActiveInstance(); active == nil || active.ID != "second" {
		t.Fatalf("expected second instance, got %+v", active)
	}

	config.ActiveInstance = "missing"
	if active := getActiveInstance(); active == nil || active.ID != "first" {
		t.Fatalf("expected fallback to first instance, got %+v", active)
	}
}

func TestEnsureValidActiveInstance(t *testing.T) {
	resetConfig(t)

	if ensureValidActiveInstance() {
		t.Error("expected no change without instances")
	}

	config.Instances = []Instance{{ID: "first", MinecraftDirectory: "/first"}}
	config.ActiveInstance = "first"

	if ensureValidActiveInstance() {
		t.Error("expected no change for a valid active instance")
	}

	config.ActiveInstance = "missing"

	if !ensureValidActiveInstance() {
		t.Error("expected change for an invalid active instance")
	}

	if config.ActiveInstance != "first" {
		t.Errorf("expected active instance first, got %q", config.ActiveInstance)
	}
}

func TestFindInstanceIndex(t *testing.T) {
	resetConfig(t)
	config.Instances = []Instance{
		{ID: "first", MinecraftDirectory: "/first"},
		{ID: "second", MinecraftDirectory: "/second"},
	}

	if index := findInstanceIndex("second"); index != 1 {
		t.Errorf("expected index 1, got %d", index)
	}

	if index := findInstanceIndex("missing"); index != -1 {
		t.Errorf("expected index -1, got %d", index)
	}
}

func TestNormalizeInstanceDir(t *testing.T) {
	dir := filepath.Join(string(filepath.Separator), "minecraft", "logs", "..", "saves")
	expected := filepath.Join(string(filepath.Separator), "minecraft", "saves")

	if got := normalizeInstanceDir(dir); got != expected {
		t.Errorf("expected %q, got %q", expected, got)
	}
}

func TestInstanceUsesDirectory(t *testing.T) {
	resetConfig(t)
	config.Instances = []Instance{
		{ID: "first", MinecraftDirectory: "/minecraft/first"},
		{ID: "second", MinecraftDirectory: "/minecraft/./second"},
	}

	if !instanceUsesDirectory("/minecraft/first/../first", "") {
		t.Error("expected cleaned path to match an existing instance")
	}

	if !instanceUsesDirectory("/minecraft/second", "") {
		t.Error("expected clean path to match a non-clean instance path")
	}

	if instanceUsesDirectory("/minecraft/first", "first") {
		t.Error("expected excluded instance to be ignored")
	}

	if instanceUsesDirectory("/minecraft/other", "") {
		t.Error("expected unused directory not to match")
	}
}

func TestInstanceHelpers(t *testing.T) {
	instance := newInstance(filepath.Join("/minecraft", "profile"))
	if instance.Name != "profile" {
		t.Errorf("expected instance name profile, got %q", instance.Name)
	}

	if instance.MinecraftDirectory != filepath.Join("/minecraft", "profile") {
		t.Errorf("unexpected instance directory: %q", instance.MinecraftDirectory)
	}

	if instance.ID == "" {
		t.Fatal("expected generated instance ID")
	}

	if _, err := hex.DecodeString(instance.ID); err != nil {
		t.Errorf("expected hex instance ID, got %q: %v", instance.ID, err)
	}

	if len(instance.ID) != 32 {
		t.Errorf("expected 32 character instance ID, got %d", len(instance.ID))
	}

	if other := newInstanceID(); other == instance.ID {
		t.Error("expected unique instance IDs")
	}

	expectedLog := "/minecraft/profile" + sep() + "logs" + sep() + "latest.log"
	if got := latestLogFileFor("/minecraft/profile"); got != expectedLog {
		t.Errorf("expected %q, got %q", expectedLog, got)
	}
}

func TestGetSettingsCopiesData(t *testing.T) {
	resetConfig(t)
	config.Instances = []Instance{{ID: "first", MinecraftDirectory: "/first"}}
	config.ActiveInstance = "first"
	config.SavedSearchQueries = map[string]string{"saved": "data"}

	a := NewApp()
	settings := a.GetSettings()

	settings.Instances[0].Name = "changed"
	settings.SavedSearchQueries["saved"] = "changed"

	if config.Instances[0].Name == "changed" {
		t.Error("expected returned instances to be a copy")
	}

	if config.SavedSearchQueries["saved"] == "changed" {
		t.Error("expected returned saved searches to be a copy")
	}
}

func TestExportSearch(t *testing.T) {
	resetConfig(t)
	a := NewApp()
	file := filepath.Join(t.TempDir(), "search.bss")
	data := `{"mode":"all","type":"include","terms":["hello",{"mode":"any","type":"exclude","terms":["world"]}]}`

	if err := a.ExportSearch(file, "search", data); err != nil {
		t.Fatalf("ExportSearch failed: %v", err)
	}

	fileData, err := os.ReadFile(file)
	if err != nil {
		t.Fatalf("failed to read exported search: %v", err)
	}

	search, err := serialization.Deserialize(fileData)
	if err != nil {
		t.Fatalf("failed to deserialize exported search: %v", err)
	}

	expected := serialization.DSearchGroup{
		Mode: "all",
		Type: "include",
		Terms: []interface{}{
			"hello",
			serialization.DSearchGroup{
				Mode:  "any",
				Type:  "exclude",
				Terms: []interface{}{"world"},
			},
		},
	}

	if !reflect.DeepEqual(search, expected) {
		t.Errorf("unexpected search: %#v", search)
	}

	if err := a.ExportSearch(file, "search", "not json"); err == nil {
		t.Error("expected invalid JSON to fail")
	}
}

func TestSaveAndGetSavedSearches(t *testing.T) {
	resetConfig(t)
	a := NewApp()

	search := serialization.DSearchGroup{
		Mode: "all",
		Type: "include",
		Terms: []interface{}{
			"hello",
			serialization.DSearchGroup{
				Mode:  "any",
				Type:  "exclude",
				Terms: []interface{}{"world"},
			},
		},
	}

	if err := a.SaveDeserializedSearchToBirchDirectory("nested", search); err != nil {
		t.Fatalf("failed to save search: %v", err)
	}

	searches, err := a.GetSavedSearches()
	if err != nil {
		t.Fatalf("GetSavedSearches failed: %v", err)
	}

	if len(searches) != 1 {
		t.Fatalf("expected 1 search, got %d", len(searches))
	}

	if searches[0].Name != "nested" {
		t.Errorf("expected search name nested, got %q", searches[0].Name)
	}

	if !reflect.DeepEqual(searches[0].Data, search) {
		t.Errorf("unexpected search data: %#v", searches[0].Data)
	}
}

func TestGetSavedSearchesMissingDirectory(t *testing.T) {
	resetConfig(t)
	a := NewApp()

	searches, err := a.GetSavedSearches()
	if err != nil {
		t.Fatalf("expected missing directory to be ignored: %v", err)
	}

	if len(searches) != 0 {
		t.Fatalf("expected no searches, got %d", len(searches))
	}
}

func TestGetFilesInLogDirectory(t *testing.T) {
	resetConfig(t)
	minecraftDir := t.TempDir()
	logsDir := filepath.Join(minecraftDir, "logs")

	if err := os.MkdirAll(filepath.Join(logsDir, "nested"), os.ModePerm); err != nil {
		t.Fatal(err)
	}

	for _, name := range []string{"latest.log", "2024-01-01.log.gz", "notes.txt"} {
		if err := os.WriteFile(filepath.Join(logsDir, name), []byte("test"), 0644); err != nil {
			t.Fatal(err)
		}
	}

	config.Instances = []Instance{{ID: "test", MinecraftDirectory: minecraftDir}}
	config.ActiveInstance = "test"

	a := NewApp()
	files, err := a.GetFilesInLogDirectory()
	if err != nil {
		t.Fatalf("GetFilesInLogDirectory failed: %v", err)
	}

	if len(files) != 2 {
		t.Fatalf("expected 2 log files, got %d", len(files))
	}

	names := map[string]bool{}
	for _, file := range files {
		names[file.Name] = true
		if file.Path != filepath.Join(logsDir, file.Name) {
			t.Errorf("unexpected path for %s: %s", file.Name, file.Path)
		}
	}

	if !names["latest.log"] || !names["2024-01-01.log.gz"] {
		t.Errorf("unexpected files: %#v", names)
	}
}

func TestUnzip(t *testing.T) {
	a := NewApp()
	file := filepath.Join(t.TempDir(), "test.log.gz")

	out, err := os.Create(file)
	if err != nil {
		t.Fatal(err)
	}

	gz := gzip.NewWriter(out)
	if _, err := gz.Write([]byte("[CHAT] hello")); err != nil {
		t.Fatal(err)
	}
	if err := gz.Close(); err != nil {
		t.Fatal(err)
	}
	if err := out.Close(); err != nil {
		t.Fatal(err)
	}

	unzipped, err := a.unzip(file)
	if err != nil {
		t.Fatalf("unzip failed: %v", err)
	}
	t.Cleanup(func() {
		os.Remove(unzipped)
	})

	content, err := os.ReadFile(unzipped)
	if err != nil {
		t.Fatal(err)
	}

	if string(content) != "[CHAT] hello" {
		t.Errorf("unexpected unzipped content: %q", content)
	}

	invalid := filepath.Join(t.TempDir(), "invalid.log.gz")
	if err := os.WriteFile(invalid, []byte("not gzip"), 0644); err != nil {
		t.Fatal(err)
	}

	if _, err := a.unzip(invalid); err == nil {
		t.Error("expected invalid gzip to fail")
	}
}

func TestChatLinesFromReader(t *testing.T) {
	input := strings.NewReader(strings.Join([]string{
		"[12:00:00] [Render thread/INFO]: Starting",
		"[12:00:01] [Render thread/INFO]: [CHAT] hello",
		"[12:00:02] [Render thread/INFO]: Nothing to see",
		"[12:00:03] [Render thread/INFO]: [CHAT] world",
	}, "\n"))

	expected := []string{
		"[12:00:01] [Render thread/INFO]: [CHAT] hello",
		"[12:00:03] [Render thread/INFO]: [CHAT] world",
	}

	got := chatLinesFromReader(input)
	if !reflect.DeepEqual(got, expected) {
		t.Errorf("expected %#v, got %#v", expected, got)
	}
}
