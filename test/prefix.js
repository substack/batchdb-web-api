var webapi = require('../');
var test = require('tape');
var batchdb = require('batchdb');
var level = require('level')
var path = require('path');
var concat = require('concat-stream');
var duplexer = require('duplexer2');
var through = require('through2');
var mkdirp = require('mkdirp');

var tmpdir = path.join(
    require('osenv').tmpdir(),
    'batchdb-web-api-test-' + Math.random()
);
mkdirp.sync(tmpdir);

test('prefix', function (t) {
    t.plan(4);
    
    var db = level(path.join(tmpdir, 'db'));
    var compute = batchdb(db, {
        path: path.join(tmpdir, 'blob'),
        run: function () {
            var input = concat(function (body) {
                t.equal(body.toString('utf8'), 'robot');
                output.end('beep boop\n');
            });
            var output = through();
            return duplexer(input, output);
        }
    });
    var api = webapi(compute, { prefix: '/api' });
    
    compute.on('result', function (key, id) {
        send('GET', '/api/blob/' + key, function (body) {
            t.equal(body.toString('utf8'), 'robot');
        });
        send('GET', '/api/blob/' + id, function (body) {
            t.equal(body.toString('utf8'), 'beep boop\n');
        });
    });
    
    send('POST', '/api/create', function (body) {
        t.ok(/^[A-Fa-f0-9]{10,}\s*$/.test(body.toString('utf8')));
    }).end('robot');
    
    compute.run();
    
    function send (method, u, cb) {
        var req = through();
        req.url = u;
        req.method = method;
        
        var res = concat(cb);
        var m = api.exec(req, res);
        return req;
    }
});
