@echo off

call npm run test
call npm run generate-license-json
call wails build -platform windows/amd64 -nsis -clean
cd ./build/bin
;; Only interested in the installer
del Birch.exe
cd ../..