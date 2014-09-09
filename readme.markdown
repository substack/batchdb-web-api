# batchdb-web-api

expose the batchdb api as an http endpoint

# example

``` js
var batchdb = require('batchdb-shell');
var db = require('level')('/tmp/compute.db');
var compute = batchdb(db, { path: '/tmp/compute.blobs' });

var http = require('http');
var api = require('batchdb-web-api')(compute);

compute.run();

var server = http.createServer(function (req, res) {
    if (batchweb.exec(req, res)) return;
    res.statusCode = 404;
    res.end('not found\n');
});
server.listen(5000);
```

# methods

``` js
var webapi = require('batchdb-web-api')
```

## var api = webapi(compute, opts)

Create a batchdb http handler instance `api` from a
[batchdb](https://npmjs.org/package/batchdb) instance `compute`.

You can pass in an `opts.prefix` string to mount the routes at a prefix.

## var m = api.exec(req, res)

If the request matches, handle the request and return the match.

## var m = api.match(req.url)

Compute whether the http request url string `req.url` should be handled

# routes

These routes are handled by the web api:

* `/create` - create a job from the contents of the POST body
* `/list/job` - list the jobs
* `/list/pending` - list the pending instances
* `/list/result` - list results
* `/job/:id` - fetch job content by its id
* `/result/:id` - fetch job results by result id

# install

With [npm](https://npmjs.org) do:

```
npm install batchdb-web-api
```

# license

MIT
