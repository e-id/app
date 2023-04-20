# Open e-ID

Open e-ID is a set of tools to provide web developers the ability to read the content of e-ID cards (such as belgium identity cards).

## Technologies

The apps are based on non intrusive, secure and standard technologies such as:

* NodeJS https://nodejs.org/
* PKCS11 https://github.com/PeculiarVentures/pkcs11js
* Yue https://github.com/yue/node-gui

## Project status

The project is under developement and not yet ready for production.

The first stable release will be 0.1.0 when it features at least:

* ✅ custom library selection
* ✅ user preferences
* ✅ error handling
* ✅ reading card content
* ✅ callback to current app
* auto update
* linux support
* firefox support (browser extension & native messaging host)

Next releases will feature:

* multilingual support
* digital signature
* authentication

## Installing

The app can be installed by downloading the release from the [releases](https://github.com/e-id/e-id/releases) page.

If no release is available, the app can be cloned, then installed and/or packaged.

More information can be found [here](INSTALL.md)

## Using

The app may require a middleware such as the belgian e-id middleware.

After downloading the app. It must be run at least once to registrer URL scheme and search a valid library.

More information for users and web developers can be found [here](USING.md)

## Contributing

More information can be found [here](CONTRIB.md)
