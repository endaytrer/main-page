#!/bin/bash
if [ ! -f tmp/proc/server.pid ] && [ ! -f tmp/proc/uploader.pid ]; then
    echo Error: programs are not running >&2
    exit 1
fi

if [ -f tmp/proc/server.pid ]; then
    kill $(cat tmp/proc/server.pid) 
    rm tmp/proc/server.pid
fi
if [ -f tmp/proc/uploader.pid ]; then
    kill $(cat tmp/proc/uploader.pid)
    rm tmp/proc/uploader.pid
fi

echo "Programs stopped."
