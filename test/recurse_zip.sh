#!/bin/bash

CMDNAME=$(basename -- "$0")
SCRIPT_DIR=$(cd -- "$(dirname -- "$0")" && pwd)

check-cmd() {
    if [ -z "$1" ]; then return 1; fi
    command -v "$1" >/dev/null || {
        echo "[$CMDNAME] Command $1 not installed. Aborted." >&2
        exit 1
    }
}
check-cmd unzip
check-cmd grep

# All STDOUT should redirect to STDERR
# STDOUT is used as a return value to parent script
[ "$#" -lt 1 ] && {
    echo "$CMDNAME: Usage: $CMDNAME <FILE[.mcaddon|.zip]>
--------------------------------------------------
Minecraft Add-on Extractor
Extract diretories recursively when its manifest
is proofreaded bu the scripts.

Returns back to the main scripts. This SHOULD NOT
be used as a parent process.
--------------------------------------------------" >&2
    exit 2
}

FILE="$(realpath "$1")"
PROCESS_PATH="$SCRIPT_DIR/../process"

unzip -Z -1 "$1" | grep -E '\.(mcpack|zip)$|manifest\.json$' | while read -r zipPath; do
    if [[ "$zipPath" =~ manifest.json$ ]]; then
        zipInternalDir="$(dirname "$zipPath")"
        targetPath="$PROCESS_PATH/queue/$zipInternalDir"
        savePath="$PROCESS_PATH/queue.zip"
        mkdir -p "$targetPath"
        [ -f "$savePath" ] && rm -f "$savePath"
        unzip -qq -o "$FILE" "$zipInternalDir/*" -d "$targetPath"
        zip -qq -or "$PWD/queue.zip" "$targetPath"
        rm -rf "$targetPath" || exit 1

        # return value
        echo "$PWD/queue.zip"
    else
        fileName=$(basename "$zipPath")
        targetPath="$PROCESS_PATH"
        mkdir -p "$targetPath"
        unzip -qq -o -j "$FILE" "$zipPath" -d "$targetPath"

        # return value
        echo "$targetPath/$fileName"
    fi
done
