'use strict'
const fs = require('fs')
const path = require('path')

const debug = require('debug')('node-modules.io:npmjs')
const watt = require('watt')
const fetch = require('node-fetch')
const sh = require('shelljs')
const temp = require('./tempfile')

module.exports = watt(function * (m, next) {
  // Fetch data from registry
  let url = `https://registry.npmjs.org/${m.urlsafe_fullname}/`
  let res = yield fetch(url)
  let json = yield res.json()
  json = json.versions[m.exact_version]
  if (!json) {
    throw Error(`NOT FOUND: A version of ${m.pretty_fullname} matching ${m.version} (resolved to ${m.exact_version}).`)
  }
  // Get the tarball URL and checksum
  let tarballUrl = json.dist.tarball
  let tarballSHA = json.dist.shasum
  debug('Downloading ' + tarballUrl + ' ...')
  // Clear space for download to land
  sh.mkdir('-p', temp.tempDir())
  let ext = path.extname(tarballUrl)
  let tempFile = temp.tempFile(m) + ext
  let tempStream = fs.createWriteStream(tempFile)
  // Download tarball
  res = yield fetch(tarballUrl)
  res.body.on('error', next.error)
  res.body.pipe(tempStream)
  yield tempStream.on('close', next)
  // Mission accomplished
  return {
    tarball: tempFile,
    shasum: tarballSHA
  }
})
