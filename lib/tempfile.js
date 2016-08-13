'use strict'
const path = require('path')
const os = require('os')

const randomNumber = (n) => Math.floor(Math.random() * Math.pow(10, n))
const tempDir      = ()  => path.join(os.homedir(), '.node-modules.io', 'tmp')
const tempFile     = (m) => path.join(tempDir(), m.name + '-' + Date.now() + randomNumber(5))

module.exports = {
  tempDir: tempDir,
  tempFile: tempFile
}
