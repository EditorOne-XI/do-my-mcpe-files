#!/bin/bash

check-cmd() {
    if [ -z "$1" ]; then return 1; fi
    command -v "$1" >/dev/null || {
        echo "[startapp.sh] Command $1 not installed. Aborted." >&2
        exit 1
    }
}
check-cmd dirname

SCRIPT_DIR=$(cd -- "$(dirname -- "$0")" && pwd)

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

synopsis() {
    echo -e "USAGE: startapp.sh [OPTIONS]
  
OPTIONS:
    -h      Shows this help.
    -p      Skip package setup.
    -n|-y   Do not prompt open browser.

Quilantia Import Builder
Made by EditorOne XI | EditorOne5312"
}

DOUP=0
INITBROWSER=''
HASMEMINFO=0
OPTIND=1
while getopts "hnpy" opt; do
case ${opt} in
    h) 
        synopsis
        exit 1
        ;;
    n) INITBROWSER='n' ;;
    p) DOUP=1 ;;
    y) INITBROWSER='y' ;;
    *) exit 1 ;;
esac
done
shift $((OPTIND - 1))

if [ $DOUP -eq 0 ]; then
    info "Setting up packages..."
    yes | pkg upgrade && pkg update
    info "Installing dependencies..."
    pkg install termux-api nodejs zip tree -y || error "Cannot parse package installation. Aborted."
    npm i express adm-zip || error "Unable to install dependencies. Stopped."
else
    warn "Skipped packages setup. The app might not work."
fi

echo 'y' | termux-setup-storage || error "Storage permission is denied. Stopped."

command -v rish >/dev/null || {
    info "Setting up rish..."
    if [ ! -f "$SCRIPT_DIR/rish" ] && [ ! -f "$SCRIPT_DIR/rish_shizuku.dex" ]; then
        error "rish binary not found. Set it up first."
    fi
    sed -i 's/export RISH_APPLICATION_ID="PKG"/export RISH_APPLICATION_ID="com.termux"/' "$SCRIPT_DIR/rish"
    mv -f "$SCRIPT_DIR/rish" "$SCRIPT_DIR/rish_shizuku.dex" "$PREFIX/bin/"
    chmod +x "$PREFIX/bin/rish"
}
info "$(type rish)"
rish -c "echo ''" >/dev/null 2>&1 || error "Command rish is not executable. Stopped."

echo -e "
NOTES:
  Press '${ESCCYAN}Ctrl+C${ESCRESET}' to close app.
  Run '${ESCCYAN}bash killapp.sh${ESCRESET}' to also clean this workplace.
"
synopsis

echo ""
[ -z "$INITBROWSER" ] && read -r -p "Open browser? [Y/n]: " openbrowser
if [[ "$openbrowser" =~ ^[Yy]$ ]] || [[ "$INITBROWSER" == 'y' ]]; then
    (read -r -t 5; termux-open http://localhost:16767 || warn "Local website did not automatically opened to a browser. Open your browser then go to 'localhost:16767' link.") &
fi

info "Reading /proc/meminfo total memory..."
MEMGET="$(awk '/MemTotal/ {printf "%.0f\n", $2/1024*0.7}' /proc/meminfo 2>/dev/null || echo 'unknown')"

[[ "$MEMGET" =~ ^[0-9]+$ ]] && HASMEMINFO=1

info "Starting Quilantia Import Builder App..."
termux-wake-lock || true

if [ "$HASMEMINFO" -eq 1 ]; then
    info "Node server run with ${ESCGREEN}$MEMGET MiB${ESCRESET} max memory size limit."
    node --expose_gc --max_old_space_size="$MEMGET" ./server.js || error "Failed to run the app. Try again."
else
    warn "/proc/meminfo status not available. Node server run with no limit."
    node --expose_gc ./server.js || error "Failed to run the app. Try again."
fi
