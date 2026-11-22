package serialization

import (
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"hash/crc32"
	"reflect"
	"testing"
)

func serializedWithVersion(version byte, body []byte) []byte {
	data := []byte{0x02, 0x09, 0x01, version}

	crc := make([]byte, 4)
	binary.LittleEndian.PutUint32(crc, crc32.ChecksumIEEE(body))
	data = append(data, crc...)
	data = append(data, body...)

	return data
}

func TestSerializeDeserializeRoundTrip(t *testing.T) {
	tests := []struct {
		name   string
		search DSearchGroup
	}{
		{
			name: "all include strings",
			search: DSearchGroup{
				Mode:  "all",
				Type:  "include",
				Terms: []interface{}{"test", "ing"},
			},
		},
		{
			name: "all exclude strings",
			search: DSearchGroup{
				Mode:  "all",
				Type:  "exclude",
				Terms: []interface{}{"test", "ing"},
			},
		},
		{
			name: "any include strings",
			search: DSearchGroup{
				Mode:  "any",
				Type:  "include",
				Terms: []interface{}{"test", "ing"},
			},
		},
		{
			name: "any exclude strings",
			search: DSearchGroup{
				Mode:  "any",
				Type:  "exclude",
				Terms: []interface{}{"test", "ing"},
			},
		},
		{
			name: "no terms",
			search: DSearchGroup{
				Mode: "all",
				Type: "include",
			},
		},
		{
			name: "nested groups",
			search: DSearchGroup{
				Mode: "all",
				Type: "include",
				Terms: []interface{}{
					"test",
					DSearchGroup{
						Mode: "all",
						Type: "include",
						Terms: []interface{}{
							"ing",
							DSearchGroup{
								Mode:  "any",
								Type:  "exclude",
								Terms: []interface{}{"minecraft", "server"},
							},
						},
					},
				},
			},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			serialized, err := Serialize(test.search)
			if err != nil {
				t.Fatalf("Serialize failed: %v", err)
			}

			deserialized, err := Deserialize(serialized)
			if err != nil {
				t.Fatalf("Deserialize failed: %v", err)
			}

			if !reflect.DeepEqual(deserialized, test.search) {
				t.Errorf("expected %#v, got %#v", test.search, deserialized)
			}

			// Serializing the deserialized value must also work, since it is
			// what happens when a saved search is imported and saved again.
			if _, err := Serialize(deserialized); err != nil {
				t.Errorf("re-serializing deserialized search failed: %v", err)
			}
		})
	}
}

func TestSerializeSearchGroupFromJSON(t *testing.T) {
	// Searches exported by the frontend are sent as JSON, so nested terms
	// arrive as maps instead of structs.
	var search DSearchGroup
	data := `{"mode":"all","type":"include","terms":["hello",{"mode":"any","type":"exclude","terms":["world"]}]}`
	if err := json.Unmarshal([]byte(data), &search); err != nil {
		t.Fatal(err)
	}

	serialized, err := Serialize(search)
	if err != nil {
		t.Fatalf("Serialize failed: %v", err)
	}

	deserialized, err := Deserialize(serialized)
	if err != nil {
		t.Fatalf("Deserialize failed: %v", err)
	}

	expected := DSearchGroup{
		Mode: "all",
		Type: "include",
		Terms: []interface{}{
			"hello",
			DSearchGroup{
				Mode:  "any",
				Type:  "exclude",
				Terms: []interface{}{"world"},
			},
		},
	}

	if !reflect.DeepEqual(deserialized, expected) {
		t.Errorf("expected %#v, got %#v", expected, deserialized)
	}
}

func TestDeserializeV1(t *testing.T) {
	search := `{"mode":"any","type":"exclude","terms":["hello",{"mode":"all","type":"include","terms":["world"]}]}`
	data := []byte(base64.StdEncoding.EncodeToString([]byte(search)))

	deserialized, err := Deserialize(data)
	if err != nil {
		t.Fatalf("Deserialize failed: %v", err)
	}

	expected := DSearchGroup{
		Mode: "any",
		Type: "exclude",
		Terms: []interface{}{
			"hello",
			map[string]interface{}{
				"mode":  "all",
				"type":  "include",
				"terms": []interface{}{"world"},
			},
		},
	}

	if !reflect.DeepEqual(deserialized, expected) {
		t.Errorf("expected %#v, got %#v", expected, deserialized)
	}
}

func TestDeserializeErrors(t *testing.T) {
	valid, err := Serialize(DSearchGroup{
		Mode:  "all",
		Type:  "include",
		Terms: []interface{}{"hello"},
	})
	if err != nil {
		t.Fatal(err)
	}

	validBody := valid[8:]

	crcMismatch := append([]byte(nil), valid...)
	crcMismatch[len(crcMismatch)-1] ^= 0xff

	tests := []struct {
		name string
		data []byte
	}{
		{
			name: "too small",
			data: []byte{0x02},
		},
		{
			name: "invalid v1 data",
			data: []byte("ey###"),
		},
		{
			name: "unknown magic number",
			data: []byte{0x03, 0x03, 0x01, 0x02, 0x00, 0x00, 0x00, 0x00},
		},
		{
			name: "wrong file type",
			data: []byte{0x02, 0x09, 0x02, 0x02, 0x00, 0x00, 0x00, 0x00},
		},
		{
			name: "crc mismatch",
			data: crcMismatch,
		},
		{
			name: "unknown version",
			data: serializedWithVersion(0x03, validBody),
		},
		{
			name: "unknown search mode",
			data: serializedWithVersion(0x02, []byte{0x05, 0x00, 0x00, 0x00}),
		},
		{
			name: "unknown search type",
			data: serializedWithVersion(0x02, []byte{0x00, 0x05, 0x00, 0x00}),
		},
		{
			name: "unknown input type",
			data: serializedWithVersion(0x02, []byte{0x00, 0x00, 0x01, 0x00, 0x05}),
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if _, err := Deserialize(test.data); err == nil {
				t.Error("expected an error")
			}
		})
	}
}

func TestSerializeErrors(t *testing.T) {
	tests := []struct {
		name   string
		search DSearchGroup
	}{
		{
			name:   "invalid mode",
			search: DSearchGroup{Mode: "invalid", Type: "include"},
		},
		{
			name:   "invalid type",
			search: DSearchGroup{Mode: "all", Type: "invalid"},
		},
		{
			name:   "invalid term",
			search: DSearchGroup{Mode: "all", Type: "include", Terms: []interface{}{42}},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if _, err := Serialize(test.search); err == nil {
				t.Error("expected an error")
			}
		})
	}
}
