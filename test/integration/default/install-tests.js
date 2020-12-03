let { join } = require('path')
let {
  existsSync,
  mkdirSync,
  writeFileSync
} = require('fs')
let test = require('tape')
let {
  reset,
  resetAndCopyShared,
  checkFolderCreation,
  arcHttp,
  nodeFunctions,
  pythonDependencies,
  rubyDependencies,
  nodeDependencies,
  pythonSharedDependencies,
  pythonViewsDependencies,
  rubySharedDependencies,
  rubyViewsDependencies,
  nodeSharedDependencies,
  nodeViewsDependencies,
  arcFileArtifacts,
  sharedArtifacts,
  viewsArtifacts,
  mockTmp,
} = require('../_shared')
let hydrate = require('../../..')
process.env.CI = true // Suppresses tape issues with progress indicator

test(`[Default (file copying)] install(undefined) hydrates all Functions', src/shared and src/views dependencies`, t => {
  let count =
    pythonDependencies.length +
    rubyDependencies().length +
    nodeDependencies.length +
    pythonSharedDependencies.length +
    pythonViewsDependencies.length +
    rubySharedDependencies.length +
    rubyViewsDependencies.length +
    nodeSharedDependencies.length +
    nodeViewsDependencies.length + 3
  t.plan(count)
  resetAndCopyShared(t, function () {
    hydrate.install(undefined, function (err) {
      if (err) t.fail(err)
      else {
        pythonDependencies.forEach(p => {
          t.ok(existsSync(p), `python dependency exists at ${p}`)
        })
        rubyDependencies().forEach(p => {
          t.ok(existsSync(p), `ruby dependency exists at ${p}`)
        })
        nodeDependencies.forEach(p => {
          t.ok(existsSync(p), `node dependency exists at ${p}`)
        })
        pythonSharedDependencies.forEach(p => {
          t.ok(existsSync(p), `python shared dependency exists at ${p}`)
        })
        rubySharedDependencies.forEach(p => {
          t.ok(existsSync(p), `ruby shared dependency exists at ${p}`)
        })
        nodeSharedDependencies.forEach(p => {
          t.ok(existsSync(p), `node shared dependency exists at ${p}`)
        })
        pythonViewsDependencies.forEach(p => {
          t.ok(existsSync(p), `python views dependency exists at ${p}`)
        })
        rubyViewsDependencies.forEach(p => {
          t.ok(existsSync(p), `ruby views dependency exists at ${p}`)
        })
        nodeViewsDependencies.forEach(p => {
          t.ok(existsSync(p), `node views dependency exists at ${p}`)
        })
        // Yarn-specific tests
        let yarnFunction = join(mockTmp, 'src', 'http', 'put-on_your_boots')
        let yarnIntFile = join(yarnFunction, 'node_modules', '.yarn-integrity')
        let pkgLockFile = join(yarnFunction, 'package-lock.json')
        t.ok(existsSync(yarnIntFile), 'Found yarn integrity file')
        t.notOk(existsSync(pkgLockFile), `Did not find package-lock.json (i.e. npm didn't run)`)
        checkFolderCreation(t)
      }
    })
  })
})

test(`[Default (file copying)] install (specific path / single path) hydrates only Functions found in the specified subpath`, t => {
  t.plan(8)
  resetAndCopyShared(t, function () {
    let basepath = nodeFunctions[0]
    hydrate.install({ basepath }, function (err) {
      if (err) t.fail(err)
      else {
        // Check to see if files that are supposed to be there are actually there
        t.ok(existsSync(nodeDependencies[0]), `scoped install for ${nodeFunctions[0]} installed dependencies in ${nodeDependencies[0]}`)
        t.notOk(existsSync(pythonDependencies[0]), `scoped install did not install dependencies for unspecified function at ${pythonDependencies[0]}`)
        let arcFileArtifact = arcFileArtifacts.find(p => p.startsWith(arcHttp[0]))
        let sharedArtifact = sharedArtifacts.find(p => p.startsWith(arcHttp[0]))
        let viewsArtifact = viewsArtifacts.find(p => p.startsWith(arcHttp[0]))
        t.ok(existsSync(nodeSharedDependencies[0]), `node shared dependency exists at ${nodeSharedDependencies[0]}`)
        t.ok(existsSync(nodeViewsDependencies[0]), `node views dependency exists at ${nodeViewsDependencies[0]}`)
        t.notOk(existsSync(arcFileArtifact), `arc file does not exist at ${arcFileArtifact}`)
        t.ok(existsSync(sharedArtifact), `shared file artifact exists at ${sharedArtifact}`)
        t.ok(existsSync(viewsArtifact), `shared file artifact exists at ${viewsArtifact}`)
        checkFolderCreation(t)
      }
    })
  })
})

test(`[Default (file copying)] install() should not recurse into Functions dependencies and hydrate those`, t => {
  t.plan(2)
  reset(t, function () {
    let subdep = join(nodeFunctions[0], 'node_modules', 'poop')
    mkdirSync(subdep, { recursive: true })
    writeFileSync(join(subdep, 'package.json'), JSON.stringify({
      name: 'poop',
      dependencies: { 'tiny-json-http': '*' }
    }), 'utf-8')
    let basepath = nodeFunctions[0]
    hydrate.install({ basepath }, function (err) {
      if (err) t.fail(err)
      else {
        let submod = join(subdep, 'node_modules')
        t.notOk(existsSync(submod), `install did not recurse into node subdependencies at ${submod}`)
        checkFolderCreation(t)
      }
    })
  })
})