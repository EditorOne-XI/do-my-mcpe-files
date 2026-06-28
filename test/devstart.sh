#!/bin/bash

# Used for auto updating frontend modifications
# ~/do-my-mcpe-files/devstart.sh

[ ! -f "./server.js" ] && {
    echo "This script is not used as a parent process."
    exit 1
}

check-cmd() {
    if [ -z "$1" ]; then return 1; fi
    command -v "$1" >/dev/null || {
        echo "[devstart.sh] Command $1 not installed. Aborted." >&2
        exit 1
    }
}
check-cmd rish
check-cmd node
check-cmd inotifywait

ESCRED="\033[91m"
ESCYELLOW="\033[93m"
ESCGREEN="\033[92m"
ESCCYAN="\033[95m"
ESCRESET="\033[0m"

if [ "$TERM" = "dumb" ]; then
    unset -v ESCRED ESCYELLOW ESCGREEN ESCCYAN ESCRESET
fi
info()    { echo -e "${ESCCYAN}[*]${ESCRESET} $*"; }
success() { echo -e "${ESCGREEN}[✓]${ESCRESET} $*"; }
warn()    { echo -e "${ESCYELLOW}[!]${ESCRESET} $*"; }
error()   { echo -e "${ESCRED}[✗] $*${ESCRESET}" >&2; exit 1; }
if [ ! "$TERM" == "dumb" ]; then
    unset -v
fi
rish -c "echo ''" >/dev/null 2>&1 || error "Command rish is not executable. Stopped."

LOGFILE="./log.txt"

echo -n '' > "$LOGFILE"
info "Starting App In-Development..."
HOSTPID=$(node --expose_gc ./server.js >> "$LOGFILE" & echo $!)
read -r -t 3
# Do not change URL
# termux-open http://localhost:16767 || warn "Local website did not automatically opened to a browser. Open your browser then go to '${ESCCYAN}127.0.0.1:5312${ESCRESET}' link."
termux-wake-lock || true
success "Finished Startup!"

trap 'kill "$HOSTPID" 2>/dev/null || pkill -f "node --expose_gc ./server.js"; exit 0' SIGINT

# FILES="./server.js ./app/index.html ./app/style.css ./app/script.js"
on_change() {
    info "$1 -- change detected in $2" >> "$LOGFILE"
    kill "$HOSTPID"
    info "Restarting App In-Development..." >> "$LOGFILE"
    HOSTPID=$(node --expose_gc ./server.js >> "$LOGFILE" & echo $!)
}

inotifywait -m -e modify ./server.js ./app/*.{html,css,js} | while read -r path action file; do
    TARGET="${file:-$path}"
    on_change "$action" "$TARGET"
done &
