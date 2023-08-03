package serialization

import (
	"bytes"
	"encoding/binary"
	"errors"
	"hash/crc32"
	"reflect"
)

func Deserialize(data []byte) (DSearchGroup, error) {
	MAGIC_NUMBERS := []byte{0x02, 0x09}
	FILE_TYPE := []byte{0x01};
	VERSIONS := map[byte]func(*bytes.Reader)(DSearchGroup, error){}
	VERSIONS[byte(0x02)] = ds_v2

	if len(data) < 2 {
		return DSearchGroup{}, errors.New("invalid data file: too small")
	}

	if isV1(data) {
		return ds_v1(data)
	}

	r := bytes.NewReader(data)

	magicNumbers := make([]byte, 2)
	r.Read(magicNumbers)
	if !reflect.DeepEqual(magicNumbers, MAGIC_NUMBERS) {
		return DSearchGroup{}, errors.New("invalid data file: magic number is unknown")
	}

	fileType := make([]byte, 1)
	r.Read(fileType)
	if !reflect.DeepEqual(fileType, FILE_TYPE) {
		return DSearchGroup{}, errors.New("invalid data file: wrong file type")
	}

	version := make([]byte, 1)
	r.Read(version)

	crc := make([]byte, 4)
	r.Read(crc)
	restOfFile := data[
		len(magicNumbers) +
		len(fileType) +
		len(version) +
		len(crc):]

	checksum := make([]byte, 4)
	binary.LittleEndian.PutUint32(checksum, uint32(crc32.ChecksumIEEE(restOfFile)))

	if !reflect.DeepEqual(crc, checksum) {
		return DSearchGroup{}, errors.New("invalid data file: CRC does not match")		
	}
	
	if ds, ok := VERSIONS[version[0]]; ok {
		return ds(r)
	} else {
		return DSearchGroup{}, errors.New("invalid data file: created in newer version of Birch")
	}
}

func isV1(data []byte) bool {
	v1FirstBytes := [2]byte{byte('e'), byte('y')}
	return data[0] == v1FirstBytes[0] && data[1] == v1FirstBytes[1]
}