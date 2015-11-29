var fs = require('fs')
var path = require('path')
var pids = require('./pids')()
var cfg = require('./pids').cfg
var pid = process.pid

pids.push(pid)

fs.writeFile(path.join(cfg, 'pids.json'), JSON.stringify(pids))

module.exports = {
  cleanup: cleanup
}

function cleanup() {
  pids = pids.filter(function (p) { return p !== pid })
  fs.writeFileSync(path.join(__dirname, 'pids.json'), JSON.stringify(pids))
}