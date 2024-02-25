#!/bin/bash
mkdir -p blogs secret_blogs client/www/modules data sites
(cd client && make all)
docker compose -f production.yaml build
docker compose -f production.yaml up -d