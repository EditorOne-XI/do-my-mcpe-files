#!/bin/bash

command -v tree >/dev/null || {
    echo "Command tree is not installed. Install if first." >&2
    exit 1
}

echo "Current Build Structure:"
tree -aL 2 __setbuild__ || {
    echo "Unable to preview build at the moment." >&2
    exit 1
}
