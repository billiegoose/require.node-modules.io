'use strict'
const path = require('path')
const os = require('os')
const watt = require('watt')
const resolve = require('./registry-resolve')
const semver = require('semver')

module.exports = watt(function * (module_string, next) {
  let parts = module_string.split('/')
  let m = {}
  // The basic 3
  m.version = parts.pop()
  m.name = parts.pop()
  m.scope = parts.pop() || ''
  // reserved for future use to distinguish 'npm' namespace from alternative namespaces
  m.realm = parts.pop() || ''
  // Work around npm's terrible naming hack for scopes
  if (m.scope) {
    m.urlsafe_fullname = m.scope + '%2f' + m.name
    m.pretty_fullname = m.scope + '/' + m.name
  } else {
    m.urlsafe_fullname = m.name
    m.pretty_fullname = m.name
  }
  // Determine exactly which version this refers to so we know
  // where to install and/or look for it.
  // Bail if invalid semver
  if (!semver.validRange(m.version)) {
    throw Error(`INVALID: the version range for module ${m.pretty_fullname} (given ${m.version})`)
  }
  // For version ranges, we need to do a network request to resolve.
  // Also, get the tarball_url and checksum
  let v = yield resolve({
    name: m.urlsafe_fullname,
    version: m.version,
    registry: 'http://registry.npmjs.org',
    full: true
  })
  if (!v) {
    throw Error(`NOT FOUND: a version of module ${m.pretty_fullname} matching ${m.version} (resolved to ${v}).`)
  }
  m.exact_version = v.version
  m.tarball_sha = v.dist.shasum
  m.tarball_url = v.dist.tarball
  if (!m.tarball_url) {
    console.log(v)
    process.exit(1)
  }
  // Where on the file system to find this module
  m.tarball_path = path.join(os.homedir(), '.node-modules.io', 'pkg', m.scope, m.name, m.exact_version + path.extname(m.tarball_url))
  m.install_path = path.join(os.homedir(), '.node-modules.io', 'lib', m.scope, m.name, m.exact_version)
  return m
})
