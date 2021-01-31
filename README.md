# Create-RX-App

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/a-tarasyuk/create-rx-app/blob/master/LICENSE) [![npm version](https://img.shields.io/npm/v/create-rx-app.svg?style=flat-square)](https://www.npmjs.com/package/create-rx-app) ![GitHub Workflow Status](https://img.shields.io/github/workflow/status/a-tarasyuk/create-rx-app/main?style=flat-square) [![npm downloads](https://img.shields.io/npm/dm/create-rx-app.svg?style=flat-square)](https://www.npmjs.com/package/create-rx-app)

> [ReactXP](https://github.com/Microsoft/reactxp) project generator for building your next awesome cross-platform (Web, Android, iOS, Windows) app

## Creating an App

> To create a new app, you may choose one of the following methods:

### npx _(npm >= **5.2**)_

```sh
npx create-rx-app AppName
```

### npm init _(npm >= **6.0**)_

```sh
npm init rx-app AppName
```

### yarn create _(yarn >= **0.25**)_

```sh
yarn create rx-app AppName
```

### npm -g

```sh
npm install create-rx-app -g

create-rx-app AppName
```

This will create a directory called **AppName** inside the current working directory. Inside **AppName**, this will generate the initial project structure and install all of its dependencies. Once this installation is done, there are some commands you can run in the project directory:

- `npm run start:web` _or_ `yarn start:web` - runs the Web version of the app in the development mode
- `npm run build:web` _or_ `yarn build:web` - builds the Web version of the app for production to the **dist-web** folder
- `npm run start:ios` _or_ `yarn start:ios` - runs the iOS version of the app and attempts to open in the iOS Simulator if you're on a Mac and have it installed
- `npm run start:android` _or_ `yarn start:android` - runs the Android version of the app and attempts to open your app on a connected Android device or emulator
- `npm run start:windows` _or_ `yarn start:windows` - runs the Windows version of the app
- `npm run start:rn-dev-server` _or_ `yarn start:rn-dev-server` - runs react native (RN) development server

## CLI options

```
--javascript    generate project in JavaScript
--skip-install  don't automatically install dependencies
--skip-jest     don't automatically add Jest configuration
--skip-yarn     don't use Yarn for managing dependencies
-v, --version   output the version number
-h, --help      output usage information
```

## System Requirements

- [Node.JS](https://nodejs.org/)
- [npm](https://nodejs.org/en/download/package-manager/) or [yarn](https://yarnpkg.com/lang/en/docs/install/)

## License and Copyright

This software is released under the terms of the [MIT license](https://github.com/a-tarasyuk/create-rx-app/blob/master/LICENSE.md).
