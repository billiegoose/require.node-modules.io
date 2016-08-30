'use strict'
const columns = require('cli-columns')
const resolveAll = require('./resolveAll')

resolveAll(process.argv[2])
.then(results => {
  console.log(`This operation will install ${results.length} packages:`)
  console.log(columns(results.map(m => `${m.name} ${m.exact_version}`)))
})
