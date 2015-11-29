var gcore = require('gcore')
var args = require('minimist')(process.argv.slice(2))
var debug = require('debug')('core-dump')
var setup = require('./lib/setup')

if (!process.parent) { setup(args, dump) }

module.exports = dump
dump.setup = function (args) { return setup(args || {}, dump) }

function dump(file) {
  var result = false
  debug('Attempting to generate core dump')
  if (process.platform !== 'linux') { 
    debug('Not a linux system, cannot generate core dump')
  } else {
    result = gcore.gcore(file || 'core') 
  }
  if (result) { debug('successfully generated core file: ' + (file || 'core')) }
  return result
}
