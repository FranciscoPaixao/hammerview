
/**
 * Module dependencies.
 */

// General Modules:
var express = require('express');
var io_base = require('socket.io');
var less = require('less-middleware');

// Node Modules:
var http = require('http');
var util = require('util');
var path = require('path');

// Application Modules:
var setup = require('./lib/setup.js');
var routes = require('./routes');
var user = require('./routes/user');

// Server Components:
var app = express();
var server = http.createServer(app);
var io = io_base.listen(server);

// Production Settings:
// io.enable('browser client minification');  // send minified client
// io.enable('browser client etag');          // apply etag caching logic based on version number
// io.enable('browser client gzip');          // gzip the file
// io.set('log level', 1);                    // reduce logging
// 
// // enable all transports (optional if you want flashsocket support, please note that some hosting
// // providers do not allow you to create servers that listen on a port different than 80 or their
// // default port)
// io.set('transports', [
//     'websocket'
//   , 'flashsocket'
//   , 'htmlfile'
//   , 'xhr-polling'
//   , 'jsonp-polling'
// ]);

/**
 * Server Setup.
 */
var config = {
	drives: ['/dev/sr0',
			'/dev/sr1'],
	socketio: io
};

console.log(util.inspect(setup, {showHidden: false, depth: null, colors: true}));
setup.init(config);

var bootstrapPath = path.join(__dirname, 'node_modules', 'bootstrap');

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'hjs');
app.use(express.favicon('public/favicon.ico'));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(less({
  src    : path.join(__dirname, 'assets', 'less'),
  paths  : [path.join(bootstrapPath, 'less')],
  dest   : path.join(__dirname, 'public', 'css'),
  prefix : '/css'
}));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

// io.sockets.on('connection', function (socket) {
//   socket.emit('news', { hello: 'world' });
//   socket.on('my other event', function (data) {
//     console.log(data);
//   });
// });



/**
 * Web Server Start:
 */

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
