# registry-resolve
Resolve a package version from an npm-like registry.  
Inspired by https://github.com/grncdr/resolve-package-versions

## Installation
`npm install registry-resolve`

## Usage
```javascript
const resolve = require('registry-resolve');

// `resolve` will contact the registry (default is npm) and 
// try to match the provided package version, returning a
// `Promise`.
//
// If there's a match, the `Promise` will resolve with
// a string containing the matched version number.
//
// If no version is matched, the `Promise` will resolve
// with  `null`

resolve(
  {
    name: 'autoprefixer',
    version: '^5.1.0',                  // optional, defaults to '*'
    registry: 'http://my.registry.url/' // optional, defaults to 'http://registry.npmjs.com/'
  }
)
.then(version => { console.log(version); }); // > '5.2.0'

// or
resolve('autoprefixer') // version defaults to '*'
  .then(version => { console.log(version); }); // > '6.3.6'

```
