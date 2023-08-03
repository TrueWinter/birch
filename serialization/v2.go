package serialization

import (
	"bytes"
	"encoding/binary"
	"errors"
)

const (
	v2_MODE_ALL = byte(0x00)
	v2_MODE_ANY = byte(0x01)
	v2_TYPE_INC = byte(0x00)
	v2_TYPE_EXC = byte(0x01)
	v2_INPT_STR = byte(0x00)
	v2_INPT_SGR = byte(0x01)
)

func ds_v2(r *bytes.Reader) (DSearchGroup, error) {
	searchGroup := DSearchGroup{}

	searchMode := make([]byte, 1)
	searchType := make([]byte, 1)
	r.Read(searchMode)
	r.Read(searchType)

	switch searchMode[0] {
		case v2_MODE_ALL:
			searchGroup.Mode = "all"
		case v2_MODE_ANY:
			searchGroup.Mode = "any"
		default:
			return DSearchGroup{}, errors.New("invalid data file: unknown search mode")
	}

	switch searchType[0] {
		case v2_TYPE_INC:
			searchGroup.Type = "include"
		case v2_TYPE_EXC:
			searchGroup.Type = "exclude"
		default:
			return DSearchGroup{}, errors.New("invalid data file: unknown search type")
	}

	inputs := make([]byte, 2)
	r.Read(inputs)
	inputsNum := binary.LittleEndian.Uint16(inputs)
	for i := 0; i < int(inputsNum); i++ {
		input, inputErr := ds_v2_input(r)
		if inputErr != nil {
			return DSearchGroup{}, inputErr
		}
		searchGroup.Terms = append(searchGroup.Terms, input)
	}

	return searchGroup, nil
}

func ds_v2_input(r *bytes.Reader) (interface{}, error) {
	inputType := make([]byte, 1)

	r.Read(inputType)
	switch inputType[0] {
		case v2_INPT_STR:
			size := make([]byte, 2)
			r.Read(size)
			sizeInt := uint32(binary.LittleEndian.Uint16(size))
			data := make([]byte, sizeInt)
			r.Read(data)
			return string(data), nil
		case v2_INPT_SGR:
			searchGroup, searchGroupErr := ds_v2(r)
			if searchGroupErr != nil {
				return DSearchGroup{}, searchGroupErr
			}
			return searchGroup, nil
		default:
			return DSearchGroup{}, errors.New("invalid data file: unknown input type")
	}
}