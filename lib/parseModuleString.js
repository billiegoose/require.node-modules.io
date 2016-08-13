'use strict'
const path = require('path')
const os = require('os')

const install_dir = path.join(os.homedir(), '.node-modules.io', 'cache')

module.exports = function parseModuleString (module_string) {
  let parts = module_string.split('/')
  let info = {}
  // The basic 3
  info.version = parts.pop()
  info.name = parts.pop()
  info.scope = parts.pop() || ''
  // reserved for future use to distinguish 'npm' namespace from alternative namespaces
  info.realm = parts.pop() || ''
  // Where on the file system to find this module
  info.install_path = path.join(install_dir, module_string)
  // Work around npm's terrible naming hack for scopes
  if (info.scope) {
    info.urlsafe_fullname = info.scope + '%2f' + info.name
    info.pretty_fullname = info.scope + '/' + info.name
  }
  return info
}
