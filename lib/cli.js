'use strict'
const columns = require('cli-columns')
const resolveAll = require('./resolveAll')
const installAll = require('./installAll')
const watt = require('watt')

let command = watt(function * (next) {
  let results = yield resolveAll(process.argv[2])
  console.log(`This modules depends on ${results.length} packages:`)
  console.log(columns(results.map(m => `${m.name} ${m.exact_version}`)))
  console.log(`This operation will install ${results.length} packages:`)
  yield installAll(results)
  console.log(`Operation completed or an error happened.`)
})
command()
