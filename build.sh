# This build script must be run on a Mac
wails build -platform darwin/amd64,windows/amd64 -nsis -clean
cd ./build/bin
pkgbuild --install-location /Applications --component Birch.app Birch.pkg
# The pkg installer will not install to /Applications if it finds Birch.app in the build directory.
# We don't talk about the amount of time I wasted trying to troubleshoot failed installations.
rm -r Birch.app