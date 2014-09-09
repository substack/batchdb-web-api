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

test('api', function (t) {
    t.plan(9);
    
    var db = level(path.join(tmpdir, 'db'));
    var compute = batchdb(db, {
        path: path.join(tmpdir, 'blob'),
        run: function () {
            var input = concat(function (body) {
                if (body.toString('utf8') === 'fail') {
                    dup.emit('error', new Error('yo'));
                    return;
                }
                
                t.equal(body.toString('utf8'), 'robot');
                output.end('beep boop\n');
            });
            var output = through();
            var dup = duplexer(input, output);
            return dup;
        }
    });
    var api = webapi(compute);
    
    compute.on('result', function (key, id) {
        send('GET', '/blob/' + key, function (body) {
            t.equal(body.toString('utf8'), 'robot');
        });
        send('GET', '/blob/' + id, function (body) {
            t.equal(body.toString('utf8'), 'beep boop\n');
        });
        send('GET', '/list/result', function (body) {
            var rows = body.toString('utf8').split('\n')
                .filter(Boolean)
                .map(function (s) { return JSON.parse(s) })
            ;
            t.equal(rows.length, 1);
            t.equal(rows[0].value.hash, id);
        });
        send('GET', '/list/blah', function (body, res) {
            t.equal(res.statusCode, 404);
        });
    });
    
    send('POST', '/create', function (body) {
        t.ok(/^[A-Fa-f0-9]{10,}\s*$/.test(body.toString('utf8')));
    }).end('robot');
    
    send('POST', '/create', function (body, res) {
        t.ok(/^[A-Fa-f0-9]{10,}\s*$/.test(body.toString('utf8')));
    }).end('fail');
    
    compute.on('fail', function (err) {
        t.equal(err.message, 'yo');
    });
    
    compute.run();
    
    function send (method, u, cb) {
        var req = through();
        req.url = u;
        req.method = method;
        
        var res = concat(function (body) { cb(body, res) });
        var m = api.exec(req, res);
        return req;
    }
});
