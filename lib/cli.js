'use strict'
const columns = require('cli-columns')
const watt = require('watt')
const asciitree = require('ascii-tree')
const chalk = require('chalk')
const resolveGraph = require('./resolveGraph')
const downloadAll = require('./downloadAll')
const installAll = require('./installAll')

// NOTE: actually, printing a tree format would require detecting and truncating circular references
function formatStore (store) {
  let format = ''
  let packages = [...store.values()].sort((a, b) => a.fullname.localeCompare(b.fullname))
  for (let pkg of packages) {
    format += `**${chalk.green(pkg.fullname)} ${pkg.version}\r\n`
    for (let d of pkg.linkedDependencies) {
      format += `***${d.fullname} ` + chalk.grey(`${d.semver} => ${d.version}`) + '\r\n'
    }
  }
  return format
}

let command = watt(function * (next) {
  resolveGraph.changeSettings({
    maxConcurrent: 4
  })
  let [head, store] = yield resolveGraph(process.argv[2])
  console.log(store)
  console.log(asciitree.generate(`*${chalk.blue(head.fullname)} ${chalk.grey(head.version)}\r\n` + formatStore(store)))
  console.log('')
  console.log(`${head.fullname}@${head.version} depends directly on ${head.dependencies.length} packages and on ${store.size} packages total:`)
  console.log('')
  console.log(columns([...store.values()].map(m => `${m.name} ${m.version}`)))
  console.log('')
  console.log('Proceed with installation? [Y/n]')
  console.log('')
  yield downloadAll(store.values())
  console.log('')
  console.log('Creating dependency links')
  yield installAll([head, store])
  console.log(`Operation completed or an error happened.`)
})
command()
