
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var io_base = require('socket.io');
var path = require('path');
var less = require('less-middleware');
var udisks = require('./lib/udisks_manager.js');
var util = require('util');

function inter_added() {
	var name = 'app_interadded';
	var currentTime = new Date();
	console.log(currentTime, ' ** '+name+' ** Monitor\n');
	console.log(util.inspect(arguments, {showHidden: false, depth: null, colors: true}));
	// drive_collect(arguments[0], function (err, device_info) {
	// 	optical_disk_device_0_info = device_info;
	// 	console.log(optical_disk_device_0_info);
	// });
}

function inter_removed() {
	var name = 'app_interadded';
	var currentTime = new Date();
	console.log(currentTime, ' ** '+name+' ** Monitor\n');
	console.log(util.inspect(arguments, {showHidden: false, depth: null, colors: true}));
}

var config = {
	drives: ['/org/freedesktop/UDisks2/block_devices/sr0',
			'/org/freedesktop/UDisks2/block_devices/sr1']
};

udisks.driveFocus(config.drives);
udisks.interfaceAdded(inter_added);
udisks.interfaceRemoved(inter_removed);

console.log('udisk object....', util.inspect(udisks, {showHidden: false, colors: true}));

var app = express();

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

var server = http.createServer(app);
var io = io_base.listen(server);

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
