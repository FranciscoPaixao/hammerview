define(['jquery', 'bootstrap', 'socket.io'],
function ($, bootstrap, io) {

	// Code goes here...
	var current_hostname = window.location.hostname;
	
	var socket = io.connect(current_hostname);
	socket.on('news', function (data) {
	  console.log(data);
	  socket.emit('my other event', { my: 'data' });
	});
});

