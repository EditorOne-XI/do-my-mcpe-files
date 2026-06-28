#!/bin/bash

if [ "$#" -ne 2 ]; then
    echo "This script is not used as a parent process."
    exit 1
fi

check-cmd() {
    if [ -z "$1" ]; then return 1; fi
    command -v "$1" >/dev/null || {
        echo "[transfer_build.sh] Command $1 not installed. Aborted." >&2
        exit 1
    }
}
check-cmd grep
check-cmd realpath
check-cmd rish
check-cmd termux-setup-storage
check-cmd zip

ESCRED="\033[91m"
ESCYELLOW="\033[33m"
ESCGREEN="\033[32m"
ESCCYAN="\033[36m"
ESCPURPLE="\033[35m"
ESCRESET="\033[0m"

if [ "$TERM" = "dumb" ]; then
    unset -v ESCRED ESCYELLOW ESCGREEN ESCCYAN ESCPURPLE ESCRESET
fi
info()      { echo -e "${ESCPURPLE}[*]${ESCRESET} $*"; }
success()   { echo -e "${ESCGREEN}[✓]${ESCRESET} $*"; }
warn()      { echo -e "${ESCYELLOW}[!]${ESCRESET} $*"; }
error()     { echo -e "${ESCRED}[✗] $*${ESCRESET}" >&2; exit 1; }

# // ARGS: MAINDIR, SETBUILD_DIR, TARGET_PACKAGE
MAINDIR="$1"
TARGET_PACKAGE="$2"

info "<|===== EXPORTING FILES =====|>"
info "$(type rish)"
rish -c "echo ''" >/dev/null 2>&1 || error "Command rish is not executable. Stopped."
success "Received '${ESCYELLOW}$TARGET_PACKAGE${ESCRESET}' as for transfer method."

exportapp_func() {
    [ -z "$1" ] && error "Need at least one argument." 
    if [ ! -s "$HOME/storage/shared" ] || [ ! -d "$HOME/storage/shared" ]; then
        error "Storage access for Termux is not available at the moment. Set it up first."
    fi
    local SAVE_DIR=$(realpath "$HOME/storage/downloads/")
    local SHARED_STORAGE=$(realpath "$HOME/storage/shared/")
    local TARGET_DIR="$SHARED_STORAGE/Android/data/$1"
    local SAVE_TEMP="$SAVE_DIR/EXPORTMC"
    local APPMANIFEST="${1%%/*}"

    info "Exporting Initiated..."
    rish -c "ls -1pqA \"$TARGET_DIR/\" | grep -w 'com.mojang/'" >/dev/null || error "$APPMANIFEST does not contain 'com.mojang' directory. Stopped."
    rish -c "cp -ru \"$TARGET_DIR/com.mojang\" \"$SAVE_TEMP\"" || error "Failed to export $APPMANIFEST. Stopped."
    success "Exported $APPMANIFEST to '$SAVE_TEMP'"
    info "Compressing..."
    cd "$SAVE_TEMP" || error "Cannot proceed to '$SAVE_TEMP' directory. Saved but not compressed."
    zip -q -ru "$SAVE_DIR/com.mojang.zip" "./" || error "Failed to archive the directory. Saved but not compressed."
    node "$MAINDIR/src/signature.js" "$SAVE_DIR/com.mojang.zip" || warn "Failed to sign archive file. Saved but not signed."
    cd "$MAINDIR" && rm -rf "$SAVE_TEMP"
    success "Successfully archived as '${ESCCYAN}$SAVE_DIR/com.mojang.zip${ESCRESET}'!"
    exit 0
}

info "Initiating: ${ESCPURPLE}$TARGET_PACKAGE${ESCRESET}"

if [[ "$TARGET_PACKAGE" == "MINECRAFT_NATIVE" ]]; then
    # path to where 'com.mojang' is located.
    # com.mojang.minecraftpe/files/games
    exportapp_func "com.mojang.minecraftpe/files/games"
else
    warn "Risk: '${ESCCYAN}$TARGET_PACKAGE${ESCRESET}' might not be a valid Android Manifest path and can bloat your device."
    exportapp_func "$TARGET_PACKAGE"
fi
