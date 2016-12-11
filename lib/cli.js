'use strict'
const columns = require('cli-columns')
const resolveGraph = require('./resolveGraph')
const installAll = require('./installAll')
const watt = require('watt')
const ascii_tree = require('ascii-tree')

// NOTE: actually, printing a tree format would require detecting and truncating circular references
const formatTree = function(pkg, prefix) {
  prefix = prefix || '*'
  let format = prefix + pkg.name + '/' + pkg.exact_version + '\r\n'
  for (let dep of pkg.dependencies) {
    format += formatTree(dep, prefix + '*')
  }
  return format
}

let command = watt(function * (next) {
  resolveGraph.changeSettings({
    maxConcurrent: 4
  })
  let graph = yield resolveGraph(process.argv[2])
  console.log(graph)
  // console.log(`This modules depends on ${results.length} packages:`)
  // console.log(columns(results.map(m => `${m.name} ${m.exact_version}`)))
  // console.log(`This operation will install ${results.length} packages:`)
  // yield installAll(results)
  console.log(`Operation completed or an error happened.`)
})
command()
