# Installing

* [Download](https://github.com/e-id/e-id/archive/refs/heads/main.zip) or clone the project
* From the project folder run the following commands:
  - `npm i`
  - `npm run build`
* The application is compiled inside the `build` folder
* To start the app, use the following command:
  - `npm run start`
* To package the app, use the following command:
  - `npm run package`
* The application package can be found inside the `dist` folder
* You can test the app using this command:
  - `npm run test`
* The test result opens in your default browser

## For administrators

Administrators can add the application to startup applications without displaying any feedback to the user (aka "silent mode").

`"Open e-ID" --quiet-mode`

It's also possible to quit the application on successfull startup.

`"Open e-ID" --quiet-mode --exit-on-success`
