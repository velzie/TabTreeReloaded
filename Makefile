SHELL := bash

all: setup tsc firefox chrome

setup:
	pnpm i
	>setup

firefox: tsc FORCE
	cp manifest_firefox.json extension/manifest.json
	sh sign.sh
chrome: tsc FORCE
	cp manifest_chrome.json extension/manifest.json
	chromium --pack-extension=extension --pack-extension-key=extension.pem


watch: tsc FORCE
	which inotifywait || echo "INSTALL INOTIFYTOOLS"
	pnpm tsc --watch &
	shopt -s globstar; while true; do inotifywait -e close_write ./scripts/**/* &>/dev/null;clear; sleep 0.5; make reload; make milestone; echo "Done!"; sleep 1; done

reload:
	kill $$(<ncpid) || true
	sh -c 'nc -lk 3333 >/dev/null & echo $$!>ncpid'

milestone:
	bash -c "cat /dev/urandom | tr -dc '[:alpha:]' | fold -w $${1:-50} | head -n 1 > extension/MILESTONE"

tsc: FORCE
	rm -f extension/scripts/*
	rm -r extension/generated
	cp -r scripts/* extension/scripts/
	chmod -w extension/scripts/*
	mkdir -p extension/generated
	pnpm tsc

# vendor: FORCE
# 	cp node_modules/@mercuryworkshop/alicejs/index.js extension/vendor/alice.js

FORCE: ;
