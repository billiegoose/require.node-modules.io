'use strict'
const os = require('os')
const sh = require('shelljs')
const path = require('path')
const watt = require('watt')

function link ({from, to}) {
  sh.mkdir('-p', path.dirname(from))
  let captureout = sh.ln('-sf', to, from)
  if (sh.error()) throw new Error('symlink error: ' + captureout)
}

function linkify (dir, m, depth) {
  if (depth === 0) return
  if (m.dependencies.length > 0) {
    // Create adjacent node modules directory
    let depDir = dir + '+node_modules'
    sh.mkdir('-p', depDir)
    // Recursively fill it with dependencies
    for (let d of m.linkedDependencies) {
      // TODO: We need some kind of way to prevent cyclic dependencies unrolling into infinite depth trees
      linkify(path.join(depDir, d.scope, d.name), d, depth - 1)
    }
  }
  // Do this last, so this links presence is an atomic guarantee it is installed.
  link({from: dir, to: m.extractPath})
}

module.exports = watt(function * ([head, store], next) {
  let headPath = path.join(os.homedir(), '.store', 'v1', 'node_modules', head.scope, head.name)
  // Install top level module
  linkify(headPath, head, 32)
  // Install link to binary (note I removed the scope because in practice that makes sense)
  // TODO: This should actually be using the "bin" value from package.json. Oops!
  let binPath = path.join(os.homedir(), '.store', 'v1', 'node_modules', '.bin', head.name)
  link({from: binPath, to: headPath})
  console.log('Done!')
})
