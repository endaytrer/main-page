#!/bin/bash
mkdir -p blogs client/www/modules data sites
(cd client && make all)
docker compose -f production.yaml up