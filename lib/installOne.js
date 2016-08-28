'use strict'
const debug = require('debug')('installOne')
const sha = require('sha')
const sh = require('shelljs')
const decompress = require('decompress')
const watt = require('watt')

const parseModuleString = require('./parseModuleString')
const download = require('./download')

module.exports = watt(function * (module_string, next) {
  const m = yield parseModuleString(module_string)
  // Install module if missing.
  if (!sh.test('-d', m.install_path)) {
    // See if we already have it downloaded
    if (sh.test('-f', m.tarball_path)) {
      debug('Detected existing tarball')
    } else {
      // Download
      debug('Downloading ' + m.tarball_url + ' ...')
      yield download(m.tarball_url, m.tarball_path)
    }
    // Verify
    yield sha.check(m.tarball_path, m.tarball_sha, next)
    debug('Checksum correct ' + m.tarball_sha)
    // Extract
    yield decompress(m.tarball_path, m.install_path, {
      map: file => {
        file.path = file.path.replace('package/', '')
        return file
      }
    })
    debug('Installed to ' + m.install_path)
  }
  return m
})
