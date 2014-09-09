var webapi = require('../');
var test = require('tape');
var batchdb = require('batchdb');
var level = require('level')
var path = require('path');
var concat = require('concat-stream');
var through = require('through2');
var mkdirp = require('mkdirp');

var tmpdir = path.join(
    require('osenv').tmpdir(),
    'batchdb-web-api-test-' + Math.random()
);
mkdirp.sync(tmpdir);

test('match', function (t) {
    t.plan(1);
    
    var db = level(path.join(tmpdir, 'db'));
    var compute = batchdb(db, {
        path: path.join(tmpdir, 'blob'),
        run: function () {}
    });
    var api = webapi(compute);
    
    send('GET', '/create', function (body, res) {
        t.equal(res.statusCode, 404);
    });
    
    function send (method, u, cb) {
        var req = through();
        req.url = u;
        req.method = method;
        
        var res = concat(function (body) { cb(body, res) });
        var m = api.exec(req, res);
        return req;
    }
    var r = api._createRouter();
});
