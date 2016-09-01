'use strict'
const columns = require('cli-columns')
const resolveAll = require('./resolveAll')
const installAll = require('./installAll')
const watt = require('watt')

let command = watt(function * (next) {
  let results = yield resolveAll(process.argv[2])
  console.log(`This modules depends on ${results.length} packages:`)
  console.log(columns(results.map(m => `${m.name} ${m.exact_version}`)))
  for (let m of results) {
    // console.log(m.tarball_url)
    console.log(`${m.name}@${m.exact_version}`)
    for (let d in m.dependencies) {
      console.log(`  ${d}@${m.dependencies[d].exact_version}`)
    }
  }
  console.log(`This operation will install ${results.length} packages:`)
  yield installAll(results)
  console.log(`Operation completed or an error happened.`)
})
command()
/*
.then(filterOutAlreadyInstalledPackages)
.then(results => {
  console.log(`This operation will install ${results.length} packages:`)
})
*/
