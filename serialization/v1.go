package serialization

import (
	"encoding/base64"
	"encoding/json"
)

func ds_v1(data []byte) (DSearchGroup, error) {
	b64, b64Err := base64.StdEncoding.DecodeString(string(data))
	if b64Err != nil {
		return DSearchGroup{}, b64Err
	}

	savedSearch := DSearchGroup{
		Mode: "all",
		Type: "include",
	}
	marshalErr := json.Unmarshal(b64, &savedSearch)
	if marshalErr != nil {
		return DSearchGroup{}, marshalErr
	}

	return savedSearch, nil
}