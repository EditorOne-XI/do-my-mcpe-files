#!/bin/bash

pkill -f 'node ./server.js' 2>/dev/null || pkill node 2>/dev/null
rm -rf ./log.txt ./__uploads__/ ./__setbuild__/ 2>/dev/null
termux-wake-unlock || true
echo "Done."
