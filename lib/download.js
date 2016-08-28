'use strict'
const fs = require('fs')
const path = require('path')
const sh = require('shelljs')
const watt = require('watt')
const fetch = require('node-fetch')

module.exports = watt(function * (tarball_url, tarball_path, next) {
  // Clear space for download to land
  sh.mkdir('-p', path.dirname(tarball_path))
  let tempStream = fs.createWriteStream(tarball_path)
  // Download tarball
  let res = yield fetch(tarball_url)
  res.body.on('error', next.error)
  res.body.pipe(tempStream)
  yield tempStream.on('close', next)
  // Mission accomplished
  return
})
