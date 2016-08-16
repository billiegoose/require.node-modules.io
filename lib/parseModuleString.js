'use strict'
const path = require('path')
const os = require('os')
const watt = require('watt')
const resolve = require('registry-resolve')
const semver = require('semver')

const install_dir = path.join(os.homedir(), '.node-modules.io', 'cache')

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
  // For exact versions, just parse and normalize it.
  if (semver.valid(m.version)) {
    m.exact_version = semver.parse(m.version).version
  // For version ranges, we need to do a network request to resolve
  } else {
    m.exact_version = yield resolve({
      name: m.name,
      version: m.version,
      registry: 'http://registry.node-modules.io'
    })
    if (!m.exact_version) {
      throw Error(`NOT FOUND: a version of module ${m.pretty_fullname} matching ${m.version} (resolved to ${m.exact_version}).`)
    }
  }
  // Where on the file system to find this module
  m.install_path = path.join(install_dir, m.scope, m.name, m.exact_version)
  return m
})
