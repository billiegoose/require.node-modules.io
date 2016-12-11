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

module.exports = watt(function * (moduleString, next) {
  let m = parseModuleString(moduleString)
  // Resolve the given semver to an exact module version
  let v = yield resolve({
    name: m.urlsafeFullname,
    version: m.semver,
    registry: 'http://registry.npmjs.org',
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
  m.tarballPath = path.join(os.homedir(), '.node-modules.io', 'cache', 'tarball', m.scope, m.name + '-' + m.version + path.extname(m.tarball.url))
  m.extractPath = path.join(os.homedir(), '.node-modules.io', 'tmp', m.scope, m.name, m.version)
  m.installPath = path.join(os.homedir(), '.node-modules.io', 'store', m.scope, m.name, m.version, m.name)
  m.packageJson = path.join(os.homedir(), '.node-modules.io', 'cache', 'package.json', m.scope, m.name + '-' + m.version + '.json')
  m.installDeps = path.join(os.homedir(), '.node-modules.io', 'installed', m.name + '+' + 'nodeModules')
}
