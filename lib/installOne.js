'use strict'
const path = require('path')

const debug = require('debug')('node-modules.io:installOne')
const sha = require('sha')
const sh = require('shelljs')
const tarball = require('tarball-extract')
const watt = require('watt')

const parseModuleString = require('./parseModuleString')
const downloadFromNpm = require('./downloadFromNpm')

const extract = watt(function * (tarpath, next) {
  let tar = path.parse(tarpath)
  let tempDir = path.format({root: tar.root, dir: tar.dir, base: tar.name})
  sh.mkdir('-p', tempDir)
  yield tarball.extractTarball(tarpath, tempDir, next)
  return tempDir
})

module.exports = watt(function * (module_string, next) {
  const m = yield parseModuleString(module_string)
  // Install module if missing.
  if (!sh.test('-d', m.install_path)) {
    // Download
    let res = yield downloadFromNpm(m, next)
    // Verify
    yield sha.check(res.tarball, res.shasum, next)
    debug('Checksum correct ' + res.shasum)
    // Extract
    let tempDir = yield extract(res.tarball)
    debug('Extracted to ' + tempDir)
    // Move to destination
    sh.rm('-rf', m.install_path)
    sh.mkdir('-p', path.dirname(m.install_path))
    sh.mv(path.join(tempDir, 'package'), m.install_path)
    debug('Installed to ' + m.install_path)
  }
  return m
})
