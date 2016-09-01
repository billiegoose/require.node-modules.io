'use strict'
const semver = require('semver')
const watt = require('watt')
const debug = require('debug')('resolveAll')

const parseModuleString = require('./parseModuleString')
const resolveOne = require('./resolveOne')

let resolved = {}

const resolveAll = watt(function * (module_string, next) {
  let todo = new Set()
  let resolving = new Set()
  let done = new Set()
  let result = []
  todo.add(module_string)
  debug(`QUEUE ${module_string}`)

  for (module_string of todo) {
    if (resolving.has(module_string)) continue
    // claim it
    resolving.add(module_string)
    debug(`START ${module_string}`)
    let m = yield parseModuleString(module_string)
    // network request - takes a while
    m = yield resolveOne(m)
    resolved[module_string] = m
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
  debug(resolved)
  // Replace dependencies listed with their resolved versions
  for (let result of result_array) {
    for (let name in result.dependencies) {
      let ver = result.dependencies[name]
      debug('Compare', `${name}/${ver}`, resolved[`${name}/${ver}`].exact_version)
      result.dependencies[name] = resolved[`${name}/${ver}`]
    }
  }
  return result_array
})
module.exports = resolveAll
