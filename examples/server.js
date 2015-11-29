//programmatic usage
var http = require('http')
var core = require('../') //require('core-dump')
var count = 0

http.createServer(function (req, res) {
  count += 1
  if (count%1000 === 0) core('core-' + count)
  res.end('ok ' + count)
}).listen(8080)