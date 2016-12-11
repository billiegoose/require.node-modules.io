'use strict'
const watt = require('watt')
const semver = require('semver')

module.exports = function (moduleString, next) {
  let parts = moduleString.split('/')
  let m = {}
  m.moduleString = moduleString
  // The basic 3
  m.semver = parts.pop()
  m.name = parts.pop()
  m.scope = parts.pop() || ''
  // reserved for future use to distinguish 'npm' namespace from alternative namespaces
  m.realm = parts.pop() || ''
  // Work around npm's terrible naming hack for scopes
  if (m.scope) {
    m.urlsafeFullname = m.scope + '%2f' + m.name
    m.fullname = m.scope + '/' + m.name
  } else {
    m.urlsafeFullname = m.name
    m.fullname = m.name
  }
  // Bail if invalid semver
  if (!semver.validRange(m.semver)) {
    throw Error(`INVALID: the semver range for module ${m.fullname} (given ${m.semver})`)
  }
  return m
}
