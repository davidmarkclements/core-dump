var fs = require('fs')
var path = require('path')
var cfg = path.join(process.env.HOME, '/.core-dump')
var pidFile = path.join(cfg, 'pids.json')

pids.cfg = cfg

module.exports = pids

function pids() {
  if (!fs.existsSync(cfg)) { fs.mkdirSync(cfg) }

  var p
  try {
    p = (fs.existsSync(pidFile) ? require(pidFile) : [])
  } catch (e) {
    p = [] 
  }

  p = p.filter(function (p) {
    var running
    try {
      running = process.kill(p, 0)
    } catch (e) {
      running = false  
    }
    return running
  })

  return p
}