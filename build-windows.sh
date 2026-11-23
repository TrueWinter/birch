#!/usr/bin/env bash
set -e

npm run test
npm run generate-license-json

wails build -platform windows/amd64 -nsis -clean

cd ./build/bin
# Only interested in the installer
rm -r Birch-amd64.exe
