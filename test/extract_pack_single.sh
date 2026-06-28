#!/bin/bash

CMDNAME=$(basename "$0")
cmdhelp() {
    cat <<EOF
$CMDNAME: Usage: $CMDNAME <FILEPATH> <directory>
EOF
    exit 2
}

if [ "$#" -lt 2 ]; then
    cmdhelp
fi

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
error()   { echo -e "${ESCRED}[✗] $*${ESCRESET}" >&2; exit 1; }

FILE="$1"
TARGET_DIR="$2"
FILENAME=$(basename "$FILE")
DIRNAME="${FILENAME%.*}"
info "Starting: $FILE ($TARGET_DIR)"

if [ "${#DIRNAME}" -gt 10 ]; then
    DIRNAME=${DIRNAME:0:10}
    info "Trimmed directory name to '$DIRNAME'"
fi

info "Extracting $FILENAME ..."
mkdir -p "$TARGET_DIR" || error "Unable to create directory. Stopped."
unzip -qq "$FILE" -d "$TARGET_DIR/$DIRNAME" || error "Failed to extract file. Stopped."

# while [ "$(find . -name "*.zip" | wc -l)" -gt 0 ]; do 
#     find . -name "*.zip" -exec unzip -q -o {} \; -exec rm {} \;; 
# done

success "Extracted. Located at $TARGET_DIR/$DIRNAME"
