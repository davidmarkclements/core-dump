var debug = require('debug')('core-dump')
var pid = require('./pid')
var SIGINT = 2

var coreDumpSigs = {
  SIGHUP: 1,
  SIGQUIT: 3,
  SIGABRT: 6,
  SIGTERM: 15,
}

module.exports = setup

function setup (args, dump) {
  debug('Setting up core dump signal and error hooks')
  if (process.platform !== 'linux') {
    debug('Not a linux system, cannot generate a core dump, won\'t setup up hooks')
    return
  }

  var opts = Object.keys(args).reduce(function (o, k) {
    o[k] = args[k]
    return o
  }, {
    'core-dump-on-sigint': false,
    'core-dump-on-uncaught-exception': true
  })


  if (debug.enabled) {
    debug('Setting up hooks with options: ' + JSON.stringify(opts))
  }
  
  //we use sigtrap for core-dump CLI, 
  //it dumps without exiting which is
  process.on('SIGTRAP', function () {
    debug('Caught SIGTRAP, dumping and continuing')
    dump()
  })

 if (opts['core-dump-on-sigint']) {
    debug('Setting up SIGINT hook')
    process.on('SIGINT', function () {
      debug('Caught SIGINT, dumping and exiting')
      dump()
      pid.cleanup()
      process.exit(SIGINT + 128)
    })
  }

  Object.keys(coreDumpSigs).forEach(function (sig) {
    debug('Setting up ' + sig + ' hook')
    process.on(sig, function () {
      debug('Caught ' + sig + ', dumping and exiting')
      dump(sig + '.core')
      pid.cleanup()
      debug('Exiting with signal ' + +(coreDumpSigs[sig] + 128))
      process.exit(coreDumpSigs[sig] + 128)
    })
  })

  if (opts['core-dump-on-uncaught-exception']) {
    process.on('uncaughtException', function (err) {
      debug('Caught uncaughtException, dumping and exiting')
      dump('uncaught-exception.core')
      console.trace(err)
      pid.cleanup()
      process.exit(1)
    })
  }

  process.on('exit', pid.cleanup)
}