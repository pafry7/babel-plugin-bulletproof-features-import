# babel-plugin-bulletproof-features-import

This is a fork of https://github.com/Grohden/babel-plugin-resolve-barrel-files that has been adapted to support bulletproof's [features imports](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md).

## Why does it exist?

Testing a React Native application that follows bulletproof's project structure with Jest can cause problems due to how Jest resolves imports:

- https://github.com/alan2207/bulletproof-react/issues/120
- https://github.com/jestjs/jest/issues/11234

This plugin doesn't solve the issue of slow start time, but it ensures that only relevant files are imported during the tests.

It can also be used to transform the imports before bundling the code for local development or production bundles. It can remove circular dependencies and reduce bundle size, although it may slow down your Fast Refresh and startup time.

## What it does?

For example, if you have a feature export in the _./src/features/login/index.js_ file:

```js
export { LoginView } from "./views/LoginView";
export { LoginButton } from "./views/components/LoginButton";
```

and you import it like this:

```js
// ./src/features/auth/views/Screen.js
import { LoginView, LoginButton } from "@/features/login";
```

it will transform your code to:

```js
// ./src/features/auth/views/Screen.js
export { LoginView } from `${absolutePathToYourFeature}/views/LoginView`
export { LoginButton } from `${absolutePathToYourFeature}/views/components/LoginButton`
```


## Installation

```
npm install --save babel-plugin-bulletproff-features-import
# or
yarn add -D babel-plugin-bullet-proof-featuers-import

```

## Options

```
{
  featuresPath: string, // absolute path to your features folder
  logLevel?: "debug" | "info",
  transformPath?: (importName: string) => string // required when you use aliases
}
```

## Usage

Add the plugin to your babel config file for it to run only in the test environment:

```js
const path = require('path');

/** @type {import('@babel/core').ConfigFunction} */
module.exports = function (api) {
     // ...
     env: {
      test: {
        plugins: [
          [
            "bulletproof-features-import",
            {
              featuresPath: path.resolve(__dirname + "./src/features")
              // logLevel: "debug" | "info"
              // transformPath: (importName) => {
                // const pattern = /^@\/features\/[^/]+\//;
                // return importPath.replace(pattern, "");
              // }
            },
          ],
        ],
      },
    },
  };
```

## Debug 
Add proper `logLevel` and run below command to inspect the files:
```
npx babel src --extensions .ts,.tsx --out-dir lib    
```
