'use strict'
const fs = require('fs')
const path = require('path')

const sh = require('shelljs')
const watt = require('watt')
const debug = require('debug')('installRecursive')

const installOne = require('./installOne')

const installRecursive = watt(function * (module_string, next) {
  // Install module if missing.
  let m = yield installOne(module_string)
  // Abort if missing package.json
  let package_path = path.join(m.install_path, 'package.json')
  if (!sh.test('-f', package_path)) {
    throw Error(`Could not find package.json in ${m.pretty_fullname}`)
  }
  // Load package.json
  try {
    var raw = yield fs.readFile(package_path, 'utf8', next)
  } catch (e) {
    throw Error(`Could not read this file: ${package_path}`)
  }
  try {
    var json = JSON.parse(raw)
  } catch (e) {
    throw Error(`Invalid JSON in file: ${package_path}`)
  }
  // Load dependencies
  let deps = json.dependencies || {}
  for (let name in deps) {
    let version = deps[name]
    debug(`${name}/${version}`)
    let child = yield installRecursive(`${name}/${version}`)
    let pretend_path = path.join(m.install_path, 'node_modules', child.scope, child.name)
    sh.mkdir('-p', path.dirname(pretend_path))
    debug('symlink ' + pretend_path + ' -> ' + child.install_path)
    sh.ln('-sf', child.install_path, pretend_path)
  }
  return m
})

module.exports = installRecursive
