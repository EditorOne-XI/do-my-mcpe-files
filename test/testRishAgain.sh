#!/bin/bash

command -v rish || {
    echo "Command rish not available on this terminal."
    exit 1
}

TEMP_DIR="/storage/emulated/0/Download"
TARGET_DIR="/storage/emulated/0/Android/data/com.mojang.minecraftpe/files/games"

rish -c "mkdir -p \"$TARGET_DIR\"" || exit 1
mv -v "./__setbuild__" "$TEMP_DIR/com.mojang" || exit 1
# mv -v "./com.mojang" "$TEMP_DIR" || exit 1
rish -c "cp -r \"$TEMP_DIR/com.mojang\" \"$TARGET_DIR\"" || exit 1
rm -rf "$TEMP_DIR/com.mojang"

echo "Done."
