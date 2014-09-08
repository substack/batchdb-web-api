var batchdb = require('batchdb-shell');
var Router = require('routes');
var through = require('through2');
var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var prefix = require('route-prefix');

module.exports = Server;
inherits(Server, EventEmitter);

function Server (compute, opts) {
    if (!(this instanceof Server)) return new Server(compute, opts);
    if (!opts) opts = {};
    this.compute = compute;
    this.router = this._createRouter(opts);
}

Server.prototype.exec = function (req, res) {
    var m = this.match(req.url);
    if (m) m.fn(req, res, m);
    return m;
};

Server.prototype.match = function (uri) {
    return this.router.match(uri);
};

Server.prototype._createRouter = function (opts) {
    var self = this;
    if (!opts) opts = {};
    var router = opts.prefix
        ? prefix(opts.prefix, Router())
        : Router()
    ;
    
    router.addRoute('/create', function (req, res, m) {
        if (req.method !== 'POST') return error(404, res, 'not a POST');
        req.pipe(self.compute.add(function (err, jobkey) {
            if (err) error(500, res, err);
            else res.end(jobkey + '\n')
        }));
    });
    
    router.addRoute('/list/:type', function (req, res, m) {
        if (req.method !== 'GET') return error(404, res, 'not a GET');
        var s = self.compute.list(m.params.type);
        if (!s) return error(404, res, 'unknown list type');
        s.pipe(through.obj(function (row, enc, next) {
            this.push(JSON.stringify(row) + '\n');
            next();
        })).pipe(res);
    });
    
    router.addRoute('/result/:id', function (req, res, m) {
        if (req.method !== 'GET') return error(404, res, 'not a GET');
        var s = self.compute.getResult(m.params.id);
        s.on('error', function (err) { error(500, res, err) });
        s.pipe(res);
    });
    
    router.addRoute('/job/:id', function (req, res, m) {
        if (req.method !== 'GET') return error(404, res, 'not a GET');
        var s = self.compute.getJob(m.params.id);
        s.on('error', function (err) { error(500, res, err) });
        s.pipe(res);
    });
    
    return router;
};

function error (code, res, err) {
    res.statusCode = code;
    res.end(err + '\n');
}
