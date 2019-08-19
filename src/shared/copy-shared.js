let cp = require('./copy')
let rmrf = require('rimraf')
let fs = require('fs')
let path = require('path')
let series = require('run-series')
let getBasePaths = require('./get-base-paths')
let {updater} = require('@architect/utils')

/**
 * copies src/shared
 * into function runtime discoverable directory
 *
 * Runtime    | Function Path
 * ----------------------------------------------------------
 * nodejs10.x | node_modules/@architect/shared/
 * ruby2.5    | vendor/shared/
 * python3.7  | vendor/shared/
 *
 */
module.exports = function copyShared(callback) {
  getBasePaths('shared', function gotBasePaths(err, paths) {
    if (err) throw err
    let update
    let shared = path.join(process.cwd(), 'src', 'shared')
    let hasShared = fs.existsSync(shared)
    if (hasShared) {
      update = updater('Hydrate')
      update.start(`Hydrating app with src${path.sep}shared`)
    }
    series(paths.map(dest=> {
      return function copier(callback) {
        if (hasShared) {
          let finalDest = path.join(dest, 'shared')
          rmrf(finalDest, {glob:false}, function(err) {
            if (err) callback(err)
            else cp(shared, finalDest, callback)
          })
        }
        else {
          callback()
        }
      }
    }),
    function done(err) {
      if (err) callback(err)
      else {
        if (update)
          update.done(`Hydrated app with src${path.sep}shared`)
        callback()
      }
    })
  })
}
