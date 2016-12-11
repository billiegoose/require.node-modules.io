'use strict'
const watt = require('watt')
const observatory = require('observatory').settings({
  prefix: '[RESOLVER] '
})
const Bottleneck = require('bottleneck')
const limiter = new Bottleneck()
const resolveModule = require('./resolveModule')
const {queued} = require('./cache')

module.exports = watt(function * (moduleString, next) {
  queued.add(moduleString)
  limiter.submit(processModule, Task(moduleString), null)
  yield limiter.on('idle', () => next())

  console.log('Done!')
  return 'TODO compute graph here'
  // const graph = new Set() // from where dependencies is set to point at the module not the version
  // for (let m of store.values()) {
  //   graph.add(m)
  // }
  // for (let m of graph) {
  //   let map = new Map()
  //   for (let d of m.dependencies) {
  //     let mod = store.get(d)
  //     map.set(mod.fullname, mod)
  //   }
  //   m.dependencies = map
  // }
  // return graph
})

module.exports.changeSettings = function ({maxConcurrent, minTime, highWater, strategy}) {
  limiter.changeSettings(maxConcurrent, minTime, highWater, strategy)
}

const Task = function (moduleString) {
  let task = {}
  task.moduleString = moduleString
  task.task = observatory.add(moduleString)
  task.task.status('queued')
  return task
}

const processModule = watt(function * ({task, moduleString}, next) {
  task.status('resolving')
  yield setTimeout(next, 1000)
  let m = yield resolveModule(moduleString)
  task.done('v' + m.version)
  // Filter dependencies already in processing
  let deps = m.dependencies.filter(x => !queued.has(x))
  let remaining = deps.length
  if (remaining === 0) {
    return m
  }
  // else
  task.details(`+ ${remaining} more`)

  // Queue children
  for (let d of deps) {
    if (!queued.has(d)) {
      queued.add(d)
      // NOTE: For some reason, I couldn't get Bottleneck to use the Promise API
      limiter.submit(processModule, Task(d), x => {
        task.details(`+ ${--remaining} more`)
        if (remaining === 0) {
          task.details('')
        }
      })
    }
  }
  return m
})
