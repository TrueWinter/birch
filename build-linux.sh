#!/usr/bin/env bash
set -e

npm run test
npm run generate-license-json

build_args=(-platform linux/amd64 -clean -tags webkit2_41)
if [ -n "${WAILS_TAGS:-}" ]; then
	build_args+=(-tags "$WAILS_TAGS")
fi

wails build "${build_args[@]}"

if ! command -v appimagetool >/dev/null 2>&1; then
	echo "appimagetool is required to build the Linux AppImage" >&2
	exit 1
fi

appdir="build/bin/Birch.AppDir"
rm -rf "$appdir"
mkdir -p "$appdir/usr/bin" \
	"$appdir/usr/share/applications" \
	"$appdir/usr/share/icons/hicolor/256x256/apps"

cp "build/bin/Birch" "$appdir/usr/bin/birch"
cp "build/appicon.png" "$appdir/usr/share/icons/hicolor/256x256/apps/birch.png"
cp "build/linux/Birch.desktop" "$appdir/usr/share/applications/Birch.desktop"

cat > "$appdir/AppRun" <<'EOF'
#!/bin/sh
HERE="$(dirname "$(readlink -f "$0")")"
exec "$HERE/usr/bin/birch" "$@"
EOF
chmod +x "$appdir/AppRun"

ln -s usr/share/applications/Birch.desktop "$appdir/Birch.desktop"
ln -s usr/share/icons/hicolor/256x256/apps/birch.png "$appdir/birch.png"

ARCH=x86_64 appimagetool "$appdir" "build/bin/Birch-amd64.AppImage"
rm -rf "$appdir"
rm build/bin/Birch