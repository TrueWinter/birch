#!/usr/bin/env bash
set -e

case "$(uname -s)" in
	Darwin)
		exec "$(dirname "$0")/build-darwin.sh"
		;;
	Linux)
		exec "$(dirname "$0")/build-linux.sh"
		;;
	MINGW*|MSYS*|CYGWIN*)
		exec "$(dirname "$0")/build-windows.sh"
		;;
	*)
		echo "Unsupported build platform: $(uname -s)" >&2
		exit 1
		;;
esac
