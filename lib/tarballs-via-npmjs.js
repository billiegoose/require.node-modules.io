'use strict'
const fs = require('fs')
const path = require('path')

const debug = require('debug')('node-modules.io:npmjs')
const watt = require('watt')
const fetch = require('node-fetch')
const sh = require('shelljs')
const temp = require('./tempfile')

module.exports = watt(function * (m, next) {
  // Normalize package name if scope exists
  if (m.scope) {
    m.name = m.scope + '%2f' + m.name
  }
  // Obtain the tarball URL
  let url = `https://registry.npmjs.org/${m.name}/`
  let res = yield fetch(url)
  let json = yield res.json()
  json = json.versions[m.version]
  if (!json) {
    throw Error(`Version not found: ${m.name}/${m.version}`)
  }
  // Log
  debug('Downloading ' + json.dist.tarball + ' ...')
  // Download tarball
  sh.mkdir('-p', temp.tempDir())
  let ext = path.extname(json.dist.tarball)
  res = yield fetch(json.dist.tarball)
  let tempFile = temp.tempFile(m) + ext
  let tempStream = fs.createWriteStream(tempFile)
  res.body.on('error', next.error)
  res.body.pipe(tempStream)
  yield tempStream.on('close', next)
  return {
    tarball: tempFile,
    shasum: json.dist.shasum
  }
})
