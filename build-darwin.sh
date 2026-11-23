#!/usr/bin/env bash
set -e

npm run test
npm run generate-license-json

wails build -platform darwin/amd64 -clean

cd ./build/bin
pkgbuild --install-location /Applications --scripts "../darwin/scripts/" --component Birch.app Birch.pkg
# The pkg installer will not install to /Applications if it finds Birch.app in the build directory.
rm -r Birch.app
