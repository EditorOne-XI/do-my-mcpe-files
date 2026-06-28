#!/bin/bash

if [ "$#" -ne 4 ]; then
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

# // ARGS: MAINDIR, SETBUILD_DIR, TARGET_PACKAGE, CLEAR_DATA
MAINDIR="$1"
SETBUILD_DIR="$2"
TARGET_PACKAGE="$3"
CLEAR_DATA="$4"

info "<|===== TRANSFERRING BUILD =====|>"
info "$(type rish)"
rish -c "echo ''" >/dev/null 2>&1 || error "Command rish is not executable. Stopped."
success "Received '${ESCYELLOW}$TARGET_PACKAGE${ESCRESET}' as for transfer method."

info "ARGS: $MAINDIR, $SETBUILD_DIR, $TARGET_PACKAGE, $CLEAR_DATA"

save_as_storage() {
    local SAVE_DIR=$(realpath "$HOME/storage/downloads/")
    info "Compressing Files..."
    if [ ! -s "$SAVE_DIR" ] || [ ! -d "$SAVE_DIR" ]; then
        error "Storage access for Termux is not available at the moment. Set it up first."
    fi
    cd "$SETBUILD_DIR" || error "Failed to locate setbuild. Stopped"
    zip -q -ru "$SAVE_DIR/com.mojang.zip" "./" || error "Failed to archive the directory. Stopped."
    node "$MAINDIR/src/signature.js" "$SAVE_DIR/com.mojang.zip" || warn "Failed to sign archive file. Saved but not signed."
    cd "$MAINDIR" && rm -rf "$SETBUILD_DIR"
    success "Completed operation. Archive is saved as '${ESCCYAN}$SAVE_DIR/com.mojang.zip${ESCRESET}'."
    exit 0
}

transferbuild_func() {
    [ -z "$1" ] && error "Need at least one argument." 
    if [ ! -s "$HOME/storage/shared" ] || [ ! -d "$HOME/storage/shared" ]; then
        error "Storage access for Termux is not available at the moment. Set it up first."
    fi
    local TEMP_DIR=$(realpath "$HOME/storage/downloads/")
    local SHARED_STORAGE=$(realpath "$HOME/storage/shared/")
    local TARGET_DIR="$SHARED_STORAGE/Android/data/$1"
    local BUILD_TEMP="$TEMP_DIR/com.mojang"
    local APPMANIFEST="${1%%/*}"
    # This is the only method that works with scripts
    # Termux and rish must able to read the files
    # If this did not work. Use FV File Manager instead

    # pm clear is used to clear the app's "ownership"
    # it is also equal to the "Clear Data" in Settings
    if [[ "$CLEAR_DATA" == "true" ]]; then
        warn "${ESCYELLOW}Clearing $APPMANIFEST data...${ESCRESET}"
        rish -c "pm clear \"$APPMANIFEST\"" >/dev/null || error "'${ESCYELLOW}$APPMANIFEST${ESCRED}' might not be installed in this device or not a valid Android Manifest."
    fi

    info "Transferring Initiated..."
    rish -c "mkdir -p \"$TARGET_DIR\"" || exit 1
    mv "./__setbuild__" "$BUILD_TEMP" || exit 1
    rish -c "cp -ru \"$BUILD_TEMP\" \"$TARGET_DIR\"" || error "Failed to transfer build to '$1'"
    rm -rf "$BUILD_TEMP" || warn "Failed to remove '$BUILD_TEMP' directory."
    success "Successfully transferred com.mojang to '$1'"
    exit 0
}

if [[ "$TARGET_PACKAGE" == "STORAGE" ]]; then
    save_as_storage
fi

info "Initiating: ${ESCPURPLE}$TARGET_PACKAGE${ESCRESET}"

if [[ "$TARGET_PACKAGE" == "MINECRAFT_NATIVE" ]]; then
    # path to where 'com.mojang' will be placed.
    # com.mojang.minecraftpe/files/games
    transferbuild_func "com.mojang.minecraftpe/files/games"
else
    warn "Risk: '${ESCCYAN}$TARGET_PACKAGE${ESCRESET}' might not be a valid Android Manifest path and can bloat your device."
    warn "Risk: Make sure to clear the data of the selected app first before executing this."
    transferbuild_func "$TARGET_PACKAGE"
fi
