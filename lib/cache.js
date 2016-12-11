'use strict'
module.exports = {
  queued: new Set(),   // name/semver
  resolves: new Map(), // from name/semver to name/version
  store: new Map()     // from name/version to package.json
}
