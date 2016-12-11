'use strict'
const fs = require('fs')
const os = require('os')
const sh = require('shelljs')
const path = require('path')
const watt = require('watt')
const assert = require('assert')
const resolve = require('registry-resolve')
const {resolves, store} = require('./cache')
const parseModuleString = require('./parseModuleString')

const registryDomainName = 'registry.npmjs.org'

module.exports = watt(function * (moduleString, next) {
  let m = parseModuleString(moduleString)
  // Resolve the given semver to an exact module version
  let v = yield resolve({
    name: m.urlsafeFullname,
    version: m.semver,
    registry: 'http://' + registryDomainName,
    full: true
  })
  if (!v) {
    throw Error(`NOT FOUND: a version of module ${m.fullname} matching ${m.semver}.`)
  }
  m.version = v.version
  m.fnv = m.fullname + '/' + m.version

  // Save this (fullname/semver -> fullname/version) mapping
  resolves.set(moduleString, m.fnv)

  // If we have seen fullname/version before, we can stop here.
  if (store.has(m.fnv)) return store.get(m.fnv)

  // Get the tarball location, checksum
  m.tarball = {}
  m.tarball.sha = v.dist.shasum
  m.tarball.url = v.dist.tarball
  assert.ok(m.tarball.url, 'MISSING DIST.TARBALL')

  // Format dependencies array
  m.dependencies = []
  for (let key in v.dependencies) {
    m.dependencies.push(key + '/' + v.dependencies[key])
  }
  // Sort dependencies for aesthetics
  m.dependencies.sort()

  // Add file path information
  addFilePaths(m)

  // Cache this result.
  store.set(m.fnv, m)
  sh.mkdir('-p', path.dirname(m.packageJson))
  yield fs.writeFile(m.packageJson, JSON.stringify(m), next)

  return m
})

// TODO: replace with function?
function addFilePaths (m) {
  // Where on the file system to find this module
  // I am generating this path explicitly, rather than copying it from the m.tarball.url path, to encourage these tarball paths to be standard, NOT
  // merely a registry implementation detail. Although technically, package.json is flexible enough that the urls be arbitrary. This might be
  // useful for security purposes (private modules) or modifying to use a particular CDN for caching... but I think that is counter
  // and would run into multiple security concerns, as well as greatly complicate things by requiring an extra round trip of network requests
  // to get the location of the tarballs for every package (potentially).
  // I'm grabbing the extension from the actual tarball.url because I'm worried I might run into a zip file or something weird.
  m.tarballPath = path.join(os.homedir(), '.store', 'v1', registryDomainName, m.scope, m.name, '-', m.name + '-' + m.version + path.extname(m.tarball.url))
  m.extractPath = path.join(os.homedir(), '.store', 'v1', registryDomainName, m.scope, m.name, m.version, m.name)
  // NOTE: It may be impractical to cache this, because as new versions are published this data must be extended.
  // But for now, we'll save it. Possibly for offline install.
  m.packageJson = path.join(os.homedir(), '.store', 'v1', registryDomainName, m.scope, m.name, m.version, 'response.json')
}
