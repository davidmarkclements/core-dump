#!/usr/bin/env node

if (!process.stdout.isTTY) {
  console.log(__dirname)
  return
}

var args = require('minimist')(process.argv.slice(2))
var pids = require('./lib/pids')()
var debug = require('debug')('core-dump')
var pid = args._[0]
require('console.table')

var psl = require('ps-list')
if (!pid) {
  debug('pid not found - checking arg keys to allow for arg order flexibility')
  Object.keys(args).some(function (k) {
    if (typeof args[k] === 'number' || typeof args[k] === 'string') {
      pid = args[k]
      return true
    }
  })
  if (debug.enabled) {
    debug(pid ? 'pid found ' : (('list' in args) ? 'pid not found' : 'pid not found, setting list to true' ))
  }
  args.list = ('list' in args) ? args.list : !pid

}

debug('getting list of all processes')
psl()
  .then(function (ps) {
    debug('filtering processes to core-dump pids')
    return ps.filter(function (p) {
      return (~pids.indexOf(p.pid))
    })
  })
  .then(function (ps) {
    if (pid && !~ps.map(function (p) { return p.pid }).indexOf(pid)) {
      if (!args.all) { 
        console.error('\nNo core-dump enabled process with pid ' + pid + '\n')
        process.exit(1)
      }
      console.warn('No core-dump enabled process with pid ' + pid)
      console.warn('Ignoring since --all flag is removing all pids')
    }

    return ps
  })
  .then(function (ps) {
    if (args.all) {
      debug('--all flag used, singalling all pids')
      return ps.map(function (p) { return p.pid }).forEach(signal)
    }
    if (args.list || !pid) {
      if (args.list && ps.length) {
        debug('outputting table of processes')
        console.log()
        console.table(ps)
      }
      if (debug.enabled && !ps.length) {
        debug('no core-dump processes available')
      }
      debug('outputting usage info')
      console.log('core-dump <pid> [--all] [--list] [--abort]')
      console.log()
      return
    }
    debug('signalling supplied pid ' + pid)
    signal(pid)
  })


function signal(pid) {
  try {
    if (!args.abort) {
      debug('sending SIGTRAP to ' + pid)
      process.kill(pid, 'SIGTRAP')
    } else {
      debug('sending SIGABRT to ' + pid)
      process.kill(pid, 'SIGABRT')
    }
  } catch (e) {
    debug('error sending signal! ' + e.message)
    console.log(e.message)
  }
}