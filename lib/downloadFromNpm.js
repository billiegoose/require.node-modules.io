'use strict'
const fs = require('fs')
const path = require('path')

const debug = require('debug')('node-modules.io:npmjs')
const watt = require('watt')
const fetch = require('node-fetch')
const sh = require('shelljs')
const temp = require('./tempfile')

module.exports = watt(function * (m, next) {
  // Obtain the tarball URL
  let url = `https://registry.npmjs.org/${m.urlsafe_fullname}/`
  let res = yield fetch(url)
  let json = yield res.json()
  json = json.versions[m.version]
  if (!json) {
    throw Error(`Version not found: ${m.pretty_fullname}/${m.version}`)
  }
  // Log
  debug('Downloading ' + json.dist.tarball + ' ...')
  // Clear space for download to land
  sh.mkdir('-p', temp.tempDir())
  let ext = path.extname(json.dist.tarball)
  let tempFile = temp.tempFile(m) + ext
  let tempStream = fs.createWriteStream(tempFile)
  // Download tarball
  res = yield fetch(json.dist.tarball)
  res.body.on('error', next.error)
  res.body.pipe(tempStream)
  yield tempStream.on('close', next)
  // Mission accomplished
  return {
    tarball: tempFile,
    shasum: json.dist.shasum
  }
})
