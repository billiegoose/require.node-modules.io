# require.node-modules.io
Experimental alternative module loader aiming to challenge the status quo

## Checklist
- [x] Locate tarball from module string
- [x] Download, verify shasum, and install tarball
- [x] Deal with scopes
- [x] Deal with semver dependencies
- [x] Fully recurse
- [x] Insert symlinks so modules are requireable (inspired by [ied](http://registry.node-modules.io/_browse/#/ied))
- [x] Make tarball locations deterministic (hence cacheable)
- [ ] Create a Set and iterate over it like a queue to prevent circular dependencies (such as `standard/8.0.0`) causing loops
- [ ] Replace symlinks with shims that use require.node-modules.io (adds an interesting possibility of continuing the "install on require" philosophy)
- [ ] Robustify

# Warning :warning: This module contains wild ideas and strong opinions
I'm not happy with Node's module management.

1. Only finding modules is defined. Installing modules is left as an exercise to the community... who came up with `npm`.
2. Node has a strange relationship with the package.json file. When looking up dependencies, it ignores it, and instead
   uses it's own directory walking algorithm, looking for files with names like `index.js` or `server.js`... or
   directories that a `package.json`... which it then reads to get the "main" entry... wait, so why is it ignoring it
   at the start?
3. The package.json file tends to get horribly out of sync with reality and requires constant tending to.
  - There is no check to stop you publishing a module that accidentally forgot a dependency in its `package.json` file.
  - There's no check that you forgot to remove an entry from `package.json` that actually isn't ever `require`d.

Anyway, one of several ideas I'm playing with to improve Node module management is moving dependency declaration
away from package.json to the file where it is actually used. This project takes inspiration from lots of places,
notably [require-install](http://registry.node-modules.io/_browse/#/require-install) and
[ied](http://registry.node-modules.io/_browse/#/ied).

# Usage

Use it just like you would require, except include the version #.

```
const node_module = require('node-modules.io')
const express = node_module('express/4.14.0')
```

It will alert you with deprecation messages if your package.json is
out of date, or update them automatically if you add an option to your `package.json` file giving it permission to do so.

```json

```

# Stream-of-conciousness
Here's what I'm thinking...

```
const node_module = require('node-modules.io')
const express = node_module('express', '4.14.0')
const body_parser = node_module('body-parser', '1.15.2')

```

Or maybe something more DRY?

```
const node_modules = require('node-modules.io')
const {express, body_parser} = node_modules('express/4.14.0', 'body-parser/1.15.2')

```

Or something that aligns with ES6 modules?
```
import * as _ from 'lodash/4.14.2'
```

That last one is probably the best option... sadly ES6 module support is lacking from Node, and I don't really want to bring a transpiler into this project... Lemme see if somebody has an "import"ish module loader for node... nope can't find one. I appologize for the stream-of-conciousness.

This looks interesting: [register-module](http://registry.node-modules.io/_browse/#/register-module)

and this: [sweetjs](http://sweetjs.org/)

OK. FINE. I'm picking one. It must
a) not be incompatible with current Node code
b) not involve scary hacks of Module._resolveFilename
c) be forward-compatible with ES6 module syntax so we can transition to it at some point.

```
const node_module = require('node-modules.io')
const express = node_module('express/4.14.0')
```

There. Simple and sweet. No better nor worse than `require`. :shrug:
