var batchdb = require('batchdb-shell');
var db = require('level')('/tmp/compute.db');
var compute = batchdb(db, { path: '/tmp/compute.blobs' });

var http = require('http');
var batchweb = require('../')(compute);

var server = http.createServer(function (req, res) {
    if (batchweb.exec(req, res)) return;
    res.statusCode = 404;
    res.end('not found\n');
});
server.listen(5000);
