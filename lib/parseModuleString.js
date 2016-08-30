'use strict'
const watt = require('watt')
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
  // Bail if invalid semver
  if (!semver.validRange(m.version)) {
    throw Error(`INVALID: the version range for module ${m.pretty_fullname} (given ${m.version})`)
  }
  return m
})
