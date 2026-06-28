#!/bin/bash

CMDNAME=$(basename "$0")
LOGID="[WP]"
FILEPATH="$1"
TARGETDIR="$2"

check-cmd() {
    if [ -z "$1" ]; then return 1; fi
    command -v "$1" >/dev/null || {
        echo "[$CMDNAME] Command $1 not installed. Aborted." >&2
        exit 1
    }
}
check-cmd unzip
check-cmd grep
check-cmd strings

if [ -z "$FILEPATH" ]; then
    echo "Usage: $CMDNAME <FILE.mcworld>"
    echo "File must contain a valid Minecraft level.dat file."
    exit 2
fi

if [ ! -f "$FILEPATH" ]; then
    echo "$LOGID Error: File does not exist."
    exit 1
fi

WORLDNBT=("LevelName" "StorageVersion" "Generator" "FlatWorldLayers")
isValid=true
LVLDAT="$(unzip -p "$1" level.dat | strings)"

for key in "${WORLDNBT[@]}"; do
    if ! echo "$LVLDAT" | grep -q -a "$key"; then
        echo "$LOGID Missing mandatory key: $key"
        isValid=false
    fi
done

if [ "$isValid" = true ]; then
    WORLDNAME=$(echo "$LVLDAT" | grep -A 1 "LevelName" | tail -n 1)
    FILENAME=$(basename "$FILEPATH")
    echo "$LOGID Checked successfully. World Name: $WORLDNAME"
    unzip -qq -o "$FILEPATH" -d "$TARGETDIR" || {
        echo "$LOGID Failed to extract $FILENAME. Stopped." >&2
        exit 1
    }
    echo "$LOGID Successfully extracted $FILENAME!"
    exit 0
else
    echo "$LOGID Check failed." >&2
    exit 1
fi
