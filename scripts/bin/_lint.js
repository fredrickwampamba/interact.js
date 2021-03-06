#!/usr/bin/env node

const { existsSync } = require('fs')

const { ESLint } = require('eslint')
const yargs = require('yargs')

const { lintSourcesGlob, lintIgnoreGlobs } = require('../utils')

const jsExt = /\.js$/
const dtsExt = /\.d\.ts$/

function isNotGenerated (source) {
  if (dtsExt.test(source) && existsSync(source.replace(dtsExt, '.ts'))) {
    return false
  }
  if (jsExt.test(source) && existsSync(source.replace(jsExt, '.ts'))) {
    return false
  }

  return true
}

const argv = yargs.boolean('fix').argv

function getSources () {
  const glob = require('glob')

  const sources = glob.sync(lintSourcesGlob, {
    ignore: lintIgnoreGlobs,
    silent: true,
  })

  return sources.filter((source) => isNotGenerated(source))
}

console.log('Linting...')

const eslint = new ESLint({
  fix: argv.fix,
  useEslintrc: true,
  // rules: { 'node/no-missing-import': 0, },
})

const sources = argv._.length ? argv._ : getSources()

;(async () => {
  const results = await eslint.lintFiles(sources)
  const formatter = await eslint.loadFormatter('stylish')

  if (argv.fix) {
    ESLint.outputFixes(results)
  }

  console.log(formatter.format(results))

  const hasUnfixedError = results.some((r) => r.errorCount > r.fixableErrorCount)

  if (hasUnfixedError) {
    process.exit(1)
  }
})()
