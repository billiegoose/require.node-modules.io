'use strict'
const debug = require('debug')('installModules')
const sha = require('sha')
const path = require('path')
const os = require('os')
const sh = require('shelljs')
const decompress = require('decompress')
const watt = require('watt')

const download = require('./download')

module.exports = watt(function * (ms, next) {
  for (let m of ms) {
    // Download
    debug('Downloading ' + m.tarball_url + ' ...')
    yield download(m.tarball_url, m.tarball_path)
    // Verify
    yield sha.check(m.tarball_path, m.tarball_sha, next)
    debug('Checksum correct ' + m.tarball_sha)
    // Extract
    yield decompress(m.tarball_path, m.extract_path)
    debug('Installed to ' + m.install_path)
    // Link
    for (let name in m.dependencies) {
      let dep = m.dependencies[name]
      debug(`linking ${name}/${m.version}`)
      let sym_path = path.join(m.install_deps, name)
      let real_path = path.join(os.homedir(), '.node-modules.io', name, dep.exact_version, 'mnt', 'package')
      sh.mkdir('-p', path.dirname(sym_path))
      debug('symlink ' + sym_path + ' -> ' + real_path)
      sh.ln('-sf', real_path, sym_path)
    }
  }
  return
})
