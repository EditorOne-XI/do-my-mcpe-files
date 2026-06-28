#!/bin/bash

PKGTEXT="    \"mcpack\"      = 0
    \"mcaddon\"     = 1
    \"mcworld\"     = 2
    \"mctemplate\"  = 3"

if [[ "$*" =~ "--help" || "$#" -eq 0 ]]; then
cat <<EOT
Usage:

mcimport.sh <int> <directory>

<int>:
$PKGTEXT

<directory>:
    Folder directory to import in Minecraft.

EOT
exit 2
fi

if [[ ! -d "$2" ]]; then
    echo "Argument 2 not a directory."
    exit 1
fi

if [[ ! "$1" =~ ^[0-3]+$ ]]; then
cat <<EOT
Argument 1 must be between 0 to 3.
$PKGTEXT
EOT
    exit 1
fi

MCEXT=(
    "mcpack"
    "mcaddon"
    "mcworld"
    "mctemplate"
)
EXT=${MCEXT[${1}]}

IFS='/' read -ra ADDR <<< "$2"
LAST_FOLDER="${ADDR[-1]}"
echo "Current folder: $LAST_FOLDER"
echo "Converting to $LAST_FOLDER.$EXT ..."

if command -v zip >/dev/null 2>&1; then
    FILE="/storage/emulated/0/--codes/mcstack/$LAST_FOLDER.$EXT"
    builtin cd "$2" || return 1
    realpath .
    mkdir -p "/storage/emulated/0/--codes/mcstack/"
    zip -rq "$FILE" ./* || {
        echo "Error encountered in zip. Aborted."
        exit 1
    }
    termux-open --content-type "com.mojang.minecraftpe.$EXT" "$FILE"
    if [ $? -ne 0 ]; then
        echo "Encountered an error opening file. Aborted."
        exit 1
    else
        echo "[SUCCESS]"
    fi
else
    echo "Package zip not installed. Aborted."
    exit 1
fi
