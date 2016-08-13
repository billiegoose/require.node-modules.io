'use strict'
const path = require('path')
const os = require('os')

const randomNumber = (n) => Math.floor(Math.random() * Math.pow(10, n))
const tmpDirectory = () => path.join(os.homedir(), '.node-modules.io', 'tmp')
const tempFilename = (m) => path.join(tmpDirectory(), m.name + '-' + Date.now() + randomNumber(5))

module.exports = {
  tempDir: tmpDirectory,
  tempFile: tempFilename
}
