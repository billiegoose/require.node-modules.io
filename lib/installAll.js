'use strict'
const debug = require('debug')('installModules')
const sha = require('sha')
const path = require('path')
const os = require('os')
const sh = require('shelljs')
sh.config.silent = true
const decompress = require('decompress')
const observatory = require('observatory').settings({
  prefix: ''
})
const watt = require('watt')

const download = require('./download')

let claimed = new Set()

const installOne = watt(function * (m, next) {
  if (claimed.has(m)) return
  claimed.add(m)
  // Download
  debug('Downloading ' + m.tarball_url + ' ...')
  try {
    m.task.status('downloading').details(m.tarball_url)
    yield download(m.tarball_url, m.tarball_path)
    // Verify
    m.task.status('checking').details(m.tarball_sha)
    yield sha.check(m.tarball_path, m.tarball_sha, next)
    // yield setTimeout(next, Math.random() * 1000 * 5)
    debug('Checksum correct ' + m.tarball_sha)
    // Extract
    m.task.status('extracting').details(m.extract_path)
    yield decompress(m.tarball_path, m.extract_path)
    sh.mkdir('-p', path.dirname(m.install_path))
    sh.cp('-R', path.join(m.extract_path, 'package/'), m.install_path)
    debug('Installed to ' + m.install_path)
    m.task.status('linking')
    // Link
    for (let name in m.dependencies) {
      let dep = m.dependencies[name]
      debug(`linking ${name}/${m.version}`)
      m.task.details(`${name}/${m.version}`)
      let sym_path = path.join(m.install_deps, name)
      let real_path = path.join(os.homedir(), '.node-modules.io', name, dep.exact_version, 'mnt', 'package')
      sh.mkdir('-p', path.dirname(sym_path))
      debug('symlink ' + sym_path + ' -> ' + real_path)
      let captureout = sh.ln('-sf', real_path, sym_path)
      if (sh.error()) throw new Error('symlink error')
    }
    m.task.done('installed').details(m.install_path)
  } catch (e) {
    m.task.fail(e.message)
  }
})

const serialThread = watt(function * (ms, next) {
  for (let m of ms) {
    yield installOne(m)
  }
})

module.exports = watt(function * (ms, opts, next) {
  if (typeof opts === 'function') {
    next = opts
    opts = {}
  }
  // Initialize pretty logger
  for (let m of ms) {
    m.task = observatory.add(m.pretty_fullname)
    m.task.status('queued')
  }
  let num_threads = opts.num_threads || ms.length
  for (let i = 0; i < num_threads; i++) {
    serialThread(ms, next.parallel())
  }
  yield next.sync()
  return
})
