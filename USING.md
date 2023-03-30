# Using

Developers can easily integrate Open e-ID application using its custom URL scheme `e-id://`

The protocol URL starts with callback URL. Open e-ID app will replace `e-id://` width `https://` when returning the result.

The result is url-encoded and appended to the callback URL. It can be saved inside the hash `#` or a parameter (e.g. `?e-id-result=`).

Examples:

* eid://e-id.github.io/test.html#
* eid://e-id.github.io/test.html?e-id-result=

## Options

Options are added to the URL as request parameters. They are all prefixed with `e-id-`

* `e-id-hidden` : set to `1` to hide/close the callback page after returning the result
  - the window might not be hidden dependind on the platform
  - the callback page have to read the `e-id-hidden` URL parameter and call `window.close()` when equals to `'1'`

* `e-id-include` : include specific keys (coma seperated) that the app excludes by default (e.g. `photo_file`)
  - all keys containing `file` or `data` are excluded by default
  - use `*` to include all keys (including keys containing `file` or `data`)
  - some platforms might not be able to load a long URL containing all the keys
  - the app add a `log_file` variable (not returned by default) containing the library and slot used when reading

* `e-id-exclude` : exclude specific keys (coma seperated) from the result
  - use `*` to exclude all keys
  - when excluding all keys, only `e-id-include` keys are included in the result

* `e-id-always` : set to `1` to always return a result (also on error & on cancel)

* `e-id-app` : set to `1` to start browser in app mode (dialog)
  - depends on the browser

## Result

The result contains a JSON representations of keys and values obtained from the card.

Each key is lowercased and the value is converted to string.

Keys containing `file` or `data` are encoded in base64.

The following keys are encoded as hex : `atr`, `chip_number`, `photo_hash`, `carddata_*`.

## Helper library
