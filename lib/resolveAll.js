'use strict'
const semver = require('semver')
const watt = require('watt')
const debug = require('debug')('resolveAll')

const parseModuleString = require('./parseModuleString')
const resolveOne = require('./resolveOne')

const resolveAll = watt(function * (module_string, next) {
  let todo = new Set()
  let doing = new Set()
  let done = new Set()
  let result = []
  todo.add(module_string)
  debug(`QUEUE ${module_string}`)

  for (module_string of todo) {
    if (doing.has(module_string)) continue
    debug(`START ${module_string}`)
    let m = yield parseModuleString(module_string)
    // claim it
    if (doing.has(`${m.name}/${m.exact_version}`)) continue
    doing.add(`${m.name}/${m.exact_version}`)
    // network request - takes a while
    m = yield resolveOne(m)
    if (done.has(`${m.name}/${m.exact_version}`)) continue
    done.add(`${m.name}/${m.exact_version}`)
    result.push(m)
    debug(` DONE ${module_string}`)
    for (let name in m.dependencies) {
      let ver = m.dependencies[name]
      // HERE IS THE INTERESTING BIT
      // we are extending the 'todo' set dynamically,
      // *while we are iterating over it*
      // which is perfectly OK because sets are guaranteed
      // to iterate in insertion order.
      // Because it is a set, it guarantees we do not
      // add the exact same package twice.
      if (!todo.has(`${name}/${ver}`)) {
        debug(`QUEUE ${name}/${ver}`)
        todo.add(`${name}/${ver}`)
      }
    }
  }
  // Sort for convenience
  let result_array = [...result]
  result_array.sort((a, b) => {
    if (a.name > b.name) return 1
    if (a.name < b.name) return -1
    // if a.name == b.name
    return semver.rcompare(a.exact_version, b.exact_version)
  })
  return result_array
})
module.exports = resolveAll
