'use strict'
const path = require('path')
const os = require('os')
const watt = require('watt')
const resolve = require('registry-resolve')
const assert = require('assert')

// Determine exactly which version this refers to so we know
// where to install and/or look for it.
module.exports = watt(function * (m, next) {
  // Resolve the given semver to an exact module version
  let v = yield resolve({
    name: m.urlsafe_fullname,
    version: m.version,
    registry: 'http://registry.npmjs.org',
    full: true
  })
  if (!v) {
    throw Error(`NOT FOUND: a version of module ${m.pretty_fullname} matching ${m.version} (resolved to ${v}).`)
  }
  // get the tarball location, checksum
  m.exact_version = v.version
  m.tarball_sha = v.dist.shasum
  m.tarball_url = v.dist.tarball
  assert.ok(m.tarball_url, 'MISSING DIST.TARBALL')
  // Where on the file system to find this module
  m.tarball_path = path.join(os.homedir(), '.node-modules.io', m.scope, m.name, m.exact_version, 'package' + path.extname(m.tarball_url))
  m.extract_path = path.join(os.homedir(), '.node-modules.io', m.scope, m.name, m.exact_version, 'mnt')
  m.install_path = path.join(os.homedir(), '.node-modules.io', m.scope, m.name, m.exact_version, 'mnt', 'package')
  m.package_json = path.join(os.homedir(), '.node-modules.io', m.scope, m.name, m.exact_version, 'package.json')
  m.install_deps = path.join(os.homedir(), '.node-modules.io', m.scope, m.name, m.exact_version, 'node_modules')
  m.dependencies = v.dependencies || {}
  return m
})
