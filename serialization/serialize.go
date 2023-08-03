package serialization

import (
	"encoding/binary"
	"encoding/json"
	"errors"
	"reflect"
	"hash/crc32"
)

type SSavedSearch struct {
	MagicNumbers [2]byte
	Type         [1]byte // File type, 0x01 for BSS
	Version      [1]byte
	CRC          [4]byte
	Data         any
}

type DSearchGroup struct {
	Mode   string `json:"mode"` // all/any
	Type   string `json:"type"` // include/exclude
	Terms  []interface{} `json:"terms"` // string or SearchGroup
}

type SSearchGroup struct {
	Mode   [1]byte // all/any
	Type   [1]byte // include/exclude
	Inputs uint16
	Data   []SInput
}

type SInput struct {
	Type [1]byte // indicated string or SearchGroup
	Size [8]byte
	Data []any // string or SearchGroup
}

func serializeInput(input interface{}, inputType string) ([]byte, error) {
	var iType [1]byte
	var size []byte
	var data []byte

	switch inputType {
		case "string":
			iType = [1]byte{0x00}
			size = make([]byte, 2)
			data = []byte(input.(string))
			binary.LittleEndian.PutUint16(size, uint16(len(data)))
		case "group":
			iType = [1]byte{0x01}
			size = make([]byte, 0)
			searchGroup := DSearchGroup{}
			j, _ := json.Marshal(input)
			_ = json.Unmarshal(j, &searchGroup)
			d, err := serializeSearchGroup(searchGroup)
			if err != nil {
				return make([]byte, 0), err
			}
			data = d
		default:
			return make([]byte, 0), errors.New("invalid search term")
	}

	output := []byte{}
	output = append(output, iType[:]...)
	output = append(output, size[:]...)
	output = append(output, data[:]...)

	return output, nil
}

func serializeSearchGroup(search DSearchGroup) ([]byte, error) {
	var searchMode [1]byte
	var searchType [1]byte
	inputs := make([]byte, 2)
	var data []byte

	switch search.Mode {
		case "all":
			searchMode = [1]byte{0x00}
		case "any":
			searchMode = [1]byte{0x01}
		default:
			return make([]byte, 0), errors.New("invalid search mode")
	}

	switch search.Type {
		case "include":
			searchType = [1]byte{0x00}
		case "exclude":
			searchType = [1]byte{0x01}
		default:
			return make([]byte, 0), errors.New("invalid search type")
	}

	binary.LittleEndian.PutUint16(inputs, uint16(len(search.Terms)))

	for _, t := range search.Terms {
		v := reflect.ValueOf(t)
		switch v.Kind() {
			case reflect.String:
				d, err := serializeInput(t, "string")
				if err != nil {
					return make([]byte, 0), err
				}

				data = append(data, d[:]...)
			case reflect.Map:
				d, err := serializeInput(t, "group")
				if err != nil {
					return make([]byte, 0), err
				}

				data = append(data, d[:]...)
			default:
				return make([]byte, 0), errors.New("invalid search terms")
		}
	}

	output := []byte{}
	output = append(output, searchMode[:]...)
	output = append(output, searchType[:]...)
	output = append(output, inputs...)
	output = append(output, data[:]...)

	return output, nil
}

func Serialize(search DSearchGroup) ([]byte, error) {
	magicNumbers := [2]byte{0x02, 0x09}
	fileType := [1]byte{0x01}
	version := [1]byte{0x02}
	crc := make([]byte, 4)

	sSearchGroup, ssgError := serializeSearchGroup(search)
	if ssgError != nil {
		return make([]byte, 0), ssgError
	}

	crcChecksum := crc32.ChecksumIEEE(sSearchGroup)
	binary.LittleEndian.PutUint32(crc, uint32(crcChecksum))

	output := []byte{}
	output = append(output, magicNumbers[:]...)
	output = append(output, fileType[:]...)
	output = append(output, version[:]...)
	output = append(output, crc...)
	output = append(output, sSearchGroup...)

	return output, nil
}