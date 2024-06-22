SHELL := bash

all: setup tsc firefox chrome

setup:
	pnpm i
	>setup

firefox: tsc FORCE
	sh sign.sh
chrome: tsc FORCE
	chromium --pack-extension=extension --pack-extension-key=extension.pem


watch: tsc FORCE
	which inotifywait || echo "INSTALL INOTIFYTOOLS"
	shopt -s globstar; while true; do inotifywait -e close_write ./src/**/* &>/dev/null;clear; sleep 0.5; make tsc; make reload; echo "Done!"; sleep 1; done

reload:
	kill $$(<ncpid) || true
	sh -c 'nc -lk 3333 >/dev/null & echo $$!>ncpid'

tsc: FORCE
	pnpm esbuild --bundle ./src/ui/main.ts --outfile=extension/generated/ui.js --sourcemap=inline
	pnpm esbuild --bundle ./src/injected/inject.ts --outfile=extension/generated/inject.js --sourcemap=inline

vendor: FORCE
	cp node_modules/dreamland/dist/dev.js extension/vendor/dreamland.js

FORCE: ;
