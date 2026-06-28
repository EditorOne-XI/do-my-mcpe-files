#!/bin/sh

CMDNAME=$(basename "$0")
ERROR=0

if [ "$#" -lt 1 ]; then
    cat <<EOF
$CMDNAME: Usage: $CMDNAME <directory> [0]
Minecraft World Directory Renaming.
Set 2nd argument as 0 to dry-run.
EOF
    exit 1
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
error()   { echo -e "${ESCRED}[✗] $*${ESCRESET}"; exit 1; }

READDIR="$1"

if [ ! -d "$READDIR" ]; then
    error "$CMDNAME: Argument 1 is not a directory."
fi
cd "$READDIR" || error "Unable to change directory."
success "Directory: $(realpath "$READDIR")"

WORLDFOLDERS=$(find . -maxdepth 1 -mindepth 1 -type d -name "*=" | sed 's|^\./||' | sort -u)

if [ -z "$WORLDFOLDERS" ]; then
    error "$CMDNAME: No directory found with [random]= name format.${ESCRESET}"
fi

success "Found $(echo "$WORLDFOLDERS" | wc -l) world directories..."

levelname=""
echo "$WORLDFOLDERS" | while IFS= read -r worlddir; do
    levelname=""
    if [ ! -d "./$worlddir" ]; then
        warn "Item '$worlddir' is not a directory. Skipping."
        continue
    fi
    levelname=$(cat "./$worlddir/levelname.txt" 2>/dev/null | sed 's/§.//g')
    if [ -z "$levelname" ]; then
        error "World '$worlddir' does not have a levelname.txt file. Stopped."
    fi
    if [ -z "$2" ]; then
        levelname=$(echo "$levelname" | sed 's/[^a-zA-Z0-9._-]/_/g')
        mv "./$worlddir" "./$levelname" >/dev/null 2>&1 || error "Cannot rename '$worlddir' to '$levelname'. Stopped."
    fi
    info "$worlddir -> $levelname"
done
ERROR=$?
if [ $ERROR -ne 0 ]; then exit $ERROR; fi

[ -z "$2" ] && success "World directory rename completed." || exit 0
