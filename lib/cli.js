'use strict'
// const columns = require('cli-columns')
const resolveGraph = require('./resolveGraph')
const watt = require('watt')
const asciitree = require('ascii-tree')
const chalk = require('chalk')

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
  let graph = yield resolveGraph(process.argv[2])
  console.log(graph)
  console.log(asciitree.generate('*' + chalk.blue(process.argv[2]) + '\r\n' + formatStore(graph)))
  // console.log(`This modules depends on ${results.length} packages:`)
  // console.log(columns(results.map(m => `${m.name} ${m.exact_version}`)))
  // console.log(`This operation will install ${results.length} packages:`)
  // yield installAll(results)
  console.log(`Operation completed or an error happened.`)
})
command()
