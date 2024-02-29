# TabTree Reloaded

A better vertical tab tree extension. Inspired by tabs-outliner, written in [Dreamland.js](https://github.com/MercuryWorkshop/AliceJS).

Best used with either [Adderall](https://github.com/CoolElectronics/adderall) on firefox, or microsoft edge for a chromium based browser.

Right click to close tabs, drag to reorganize, everything saves on quit
![image](https://github.com/CoolElectronics/TabTreeReloaded/assets/58010778/a7c66796-f714-4f36-a1c4-4d85a2297315)

# Building
Building only works on linux.

```sh
git clone https://github.com/CoolElectronics/TabTreeReloaded
cd TabTreeReloaded
make setup
make all
```

It will generate an `extension.crx` at root and an xpi file for firefox inside `web-ext-artifacts/`.

Alternatively, you can run `make tsc` and load the `extensions/` directory as an unpacked/temporary extension, or use web-ext run

please go into about:config and set `browser.sessionstore.resume_from_crash` to false
