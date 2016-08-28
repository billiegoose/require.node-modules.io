'use strict';

const semver = require('semver');
const fetch = require('node-fetch');
const url = require('url');

module.exports = pkg => {
  if (typeof pkg === 'string') {
    pkg = {
      name: pkg
    }
  }

  if (!pkg || !pkg.name) {
    throw new Error('You must provide a package name');
  }

  pkg.version = pkg.version || '*';

  if (!semver.validRange(pkg.version)) {
    throw new Error('That is not a valid package version range');
  }

  pkg.registry = pkg.registry || 'http://registry.npmjs.com/';

  return fetch(url.resolve(pkg.registry, pkg.name))
    .then(response => response.json())
    .then(data => {
      let v = semver.maxSatisfying(Object.keys(data.versions || {}), pkg.version);
      return (pkg.full) ? data.versions[v] : v;
    })
    .catch(err => { throw new Error(err); });
}
