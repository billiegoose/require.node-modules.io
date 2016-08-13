'use strict'
const path = require('path')
const os = require('os')

const debug = require('debug')('node-modules.io')
const sha = require('sha')
const sh = require('shelljs')
const tarball = require('tarball-extract')
const watt = require('watt')

const tarballsViaNpmjs = require('./tarballs-via-npmjs')

const installDir = path.join(os.homedir(), '.node-modules.io', 'cache')

function parseModulePath (module_path) {
  let parts = module_path.split('/')
  let info = {}
  info.version = parts.pop()
  info.name = parts.pop()
  info.scope = parts.pop() || ''
  info.realm = parts.pop() || '' // reserved for 'npm' vs others
  return info
}

const extract = watt(function * (tarpath, next) {
  let tar = path.parse(tarpath)
  let tempDir = path.format({root: tar.root, dir: tar.dir, base: tar.name})
  sh.mkdir('-p', tempDir)
  yield tarball.extractTarball(tarpath, tempDir, next)
  return tempDir
})

module.exports = watt(function * (module_path, next) {
  const dest = path.join(installDir, module_path)
  try {
    return require(dest)
  } catch (e) {
    // console.log(e.stack.indexOf(installDir))
    // return
    // install module
    let m = parseModulePath(module_path)
    // Download
    let res = yield tarballsViaNpmjs(m, next)
    // Verify
    yield sha.check(res.tarball, res.shasum, next)
    debug('Checksum correct ' + res.shasum)
    // Extract
    let tempDir = yield extract(res.tarball)
    debug('Extracted to ' + tempDir)
    // Move to destination
    sh.rm('-rf', dest)
    sh.mkdir('-p', path.dirname(dest))
    sh.mv(path.join(tempDir, 'package'), dest)
    debug('Installed to ' + dest)
    // sh.mkdir('-p', dest)
    debug('TODO: Recursively install.')
  }
})
