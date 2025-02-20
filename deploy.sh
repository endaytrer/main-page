#!/bin/bash
PORT=43063
mkdir -p blogs secret_blogs client/www/modules data sites tmp/{logs,proc}
(cd client && make all)

if [ -f tmp/proc/server.pid ] || [ -f tmp/proc/uploader.pid ]; then
    echo Error: programs are already running >&2
    exit 1
fi

source venv/bin/activate
echo "running uploader and server..."
nohup python3 uploader/app.py > tmp/logs/uploader.log 2>&1 &
echo $! > tmp/proc/uploader.pid
nohup python3 server/app.py $PORT > tmp/logs/server.log 2>&1 &
echo $! > tmp/proc/server.pid
echo "Server is up and running at http://127.0.0.1:$PORT"