#!/bin/bash

CMDNAME=$(basename "$0")
CWD="$PWD"

command -v file >/dev/null || {
    echo "$CMDNAME: file command does not exist. Aborted."
    exit 1
}

usehelp() {
    cat <<EOF
$CMDNAME: Minecraft BE Packs Merger.

Usage:
    $CMDNAME <zipname> <FILE>...
    $CMDNAME <directory> [zipname]

Default for zipname will be 'merged.mcaddon'
EOF
    exit 2
}
[ "$#" -lt 1 ] && usehelp

ESCRED="\033[91m"
ESCYELLOW="\033[33m"
ESCGREEN="\033[32m"
ESCCYAN="\033[36m"
ESCRESET="\033[0m"

if [ "$TERM" = "dumb" ]; then
    unset -v ESCRED ESCYELLOW ESCGREEN ESCCYAN ESCRESET
fi
info()    { echo -e "${ESCCYAN}[*]${ESCRESET} $*"; }
success() { echo -e "${ESCGREEN}[✓]${ESCRESET} $*"; }
warn()    { echo -e "${ESCYELLOW}[!]${ESCRESET} $*"; }
error()   { echo -e "${ESCRED}[✗] $*${ESCRESET}"; exit 1; }

checkmanifest() {
    FILE="$1"
    local mimetype
    mimetype="$(file -b --mime-type "$FILE")"
    [ ! -f "$FILE" ] && error "Item '$FILE' not a file. Stopped."
    if [[ ! "$mimetype" == "application/zip" ]]; then
        warn "Item '$FILE' is not a ZIP archive file. Skipping."
        return 2
    fi
    if ! unzip -l "$FILE" | grep -qw 'manifest.json'; then
        warn "Archive '$FILE' does not contain 'manifest.json'. Skipping."
        return 2
    fi
    return 0
}

[ -d "$CWD/tmpmrg" ] && rm -rf "$CWD/tmpmrg"

ZIPNAME=""
usefiles() {
    ZIPNAME="${1:-merged.mcaddon}"
    shift

    mkdir -p "$CWD/tmpmrg"
    local nfile

    for f in "$@"; do
        checkmanifest "$f" || continue
        nfile=$(basename "$f")
        [[ "$nfile" == "$ZIPNAME" ]] && continue
        folder_name="${nfile%.zip}"
        folder_name="${folder_name%.mcpack}"
        folder_name="${folder_name%.mcaddon}"
        unzip -qq "$f" -d "$CWD/tmpmrg/$folder_name" || error "Cannot extract $nfile. Stopped."
        info "Extracted $folder_name."
    done
    success "Completed extracting files."
}

usedir() {
    cd "$1" || error "$1 not a directory. Aborted."
    ZIPNAME="${2:-merged.mcaddon}"
    ZIPFILES=$(find . -maxdepth 1 -type f \( -name "*.zip" -o -name "*.mcpack" -o -name "*.mcaddon" \) | sort -u)
    if [ -z "$ZIPFILES" ]; then
        error "No archive of zip, mcpack, or mcaddon found. Stopped."
    fi
    success "Found $(echo "$ZIPFILES" | wc -l) archives."
    echo "$ZIPFILES" | column

    mkdir -p "$CWD/tmpmrg"
    local folder_name
    local nfile
    while IFS= read -r f; do
        checkmanifest "$f" || continue
        nfile=$(basename "$f")
        [[ "$nfile" == "$ZIPNAME" ]] && continue
        folder_name="${nfile%.zip}"
        folder_name="${folder_name%.mcpack}"
        folder_name="${folder_name%.mcaddon}"
        unzip -qq "$f" -d "$CWD/tmpmrg/$folder_name" || error "Cannot extract $nfile. Stopped."
        info "Extracted $folder_name."
    done < <(echo "$ZIPFILES")
    success "Completed extracting files."
}

if [ -d "$1" ]; then
    usedir "$@"
else
    [ "$#" -lt 2 ] && usehelp
    usefiles "$@"
fi

cd "$CWD/tmpmrg" || error "Unable to change directory. [Fault]"
info "Compressing merged packs..."
zip -r "../$ZIPNAME" .
cd ..
info "Cleaning temporary files..."
rm -rf tmpmrg
success "Finished merging archives. Saved as '$ZIPNAME'"

echo ""
read -r -p "Open with Minecraft? [Y/n]: " yn
case "$yn" in
    [Yy]) ;;
    *) exit 0 ;;
esac
echo "Opening '$ZIPNAME' using termux-open... [Change if different]"

# Change command if different
termux-open --content-type "com.mojang.minecraftpe.mcaddon" "$CWD/$ZIPNAME"
