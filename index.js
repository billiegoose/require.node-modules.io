'use strict'
const path = require('path')
const os = require('os')

const fetch = require('node-fetch')
const sha = require('sha')
const sh = require('shelljs')
const tarball = require('tarball-extract')
const watt = require('watt')

const installDir = path.join(os.homedir(), '.node-modules.io', 'cache')
const tempDir = path.join(os.homedir(), '.node-modules.io', 'tmp')

const randomNumber = (n) => Math.floor(Math.random() * Math.pow(10, n))

module.exports = watt(function * (module_path, next) {
  const dest = path.join(installDir, module_path)
  try {
    return require(dest)
  } catch (e) {
    // console.log(e.stack.indexOf(installDir))
    // return
    // install module
    let parts = module_path.split('/')
    let version = parts.pop()
    let name = parts.pop()
    let scope = parts.pop() || ''
    let realm = parts.pop() || '' // reserved for 'npm' vs others
    let tempFile = path.join(tempDir, name + '-' + Date.now() + randomNumber(5))
    // Normalize package name if scope exists
    if (scope) {
      name = scope + '%2f' + name
    }
    // Obtain the tarball URL
    let url = `https://registry.npmjs.org/${name}/`
    let res = yield fetch(url)
    let json = yield res.json()
    json = json.versions[version]
    if (!json) {
      throw Error(`Version not found: ${name}/${version}`)
    }
    // Create the output file stream
    sh.mkdir('-p', tempFile)
    // let tarball = fs.createWriteStream(tempFile)
    // Download the file
    console.log('Downloading', json.dist.tarball, '...')
    let ext = path.extname(json.dist.tarball)
    yield tarball.extractTarballDownload(json.dist.tarball, tempFile + ext, tempFile, {}, next)
    console.log('Extracted to', tempFile)
    // Confirm checksum
    yield sha.check(tempFile + ext, json.dist.shasum, next)
    console.log('Checksum correct', json.dist.shasum)
    // Move to destination
    sh.mkdir('-p', path.dirname(dest))
    sh.mv(path.join(tempFile, 'package'), dest)
    console.log('Installed to', dest)
    // sh.mkdir('-p', dest)
    console.log('TODO: Recursively install.')
  }
})

if (!module.parent) {
  // module.exports('shelljs/0.7.3')
  module.exports('@wmhilton/log/1.0.1')
}
