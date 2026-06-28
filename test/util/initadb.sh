#!/bin/sh

command -v adb >/dev/null || {
    echo "adb is not installed. Aborted." >&2
    exit 1
}


cat <<EOF
To make use of Android Debugging Bridge (ADB). You have to pair and connect it to your Wireless Debugging.

TL;DR 
Read how to Enable Developer Options and Wireless Debugging here:
https://developer.android.com/studio/debug/dev-options

EOF
read -r -p "Skip pairing? [y/N]: " showpair

if [[ ! "$showpair" =~ ^[Yy]$ ]]; then
    cat <<EOF
After learning how to Enable Wireless Debugging;
1) Split Screen (or any method of multi-window) Setting on the top and Termux at the bottom.
2) Open Pairing Code from Wireless Debugging.
EOF
    read -r -p "3) Enter Pairing Port: " pairport
    adb pair "localhost:$pairport" 2>/dev/null|| {
        echo "Failed to pair Wireless Debugging. Try again!" >&2
        exit 1
    }
    echo ""
fi

read -r -p "4) Enter Connection Port: " connectport
adb connect "localhost:$connectport" 2>/dev/null
adb get-state 2>/dev/null || {
    echo "Failed to connect adb. Try again!" >&2
    exit 1
}
echo ""
echo "Successfully connected adb to device."
