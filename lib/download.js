'use strict'
const fs = require('fs')
const path = require('path')
const sh = require('shelljs')
const watt = require('watt')
const fetch = require('node-fetch')

module.exports = watt(function * (tarballUrl, tarballPath, next) {
  // Clear space for download to land
  sh.mkdir('-p', path.dirname(tarballPath))
  let tempStream = fs.createWriteStream(tarballPath)
  // Download tarball
  let res = yield fetch(tarballUrl)
  res.body.on('error', next.error)
  res.body.pipe(tempStream)
  yield tempStream.on('close', next)
  // Mission accomplished
  return
})
