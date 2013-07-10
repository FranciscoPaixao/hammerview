(function () {

	var udisks = require('./udisks_manager.js');
	var redis = require("redis");
	
	var async = require('async');
	var _ = require('underscore');
	var util = require('util');

	var sm = require('./state-machine.js');

	var stateObj = {
		//initial: { state: 'clear', event: 'init', defer: true },
		initial: 'clear',
		events: [
			{name: 'start', from: 'clear', to: 'diskInserted'},
			{name: 'scan', from: ['clear','diskInserted'], to: 'scanDisk'},
			{name: 'metadata', from: ['clear','scanDisk'], to: 'getMetadata'},
			{name: 'dump', from: ['clear','getMetadata'], to: 'dumpMkv'},
			{name: 'handbrake', from: ['clear','dumpMkv'], to: ['ejectDisk', 'handbrakeMkv']},
			{name: 'store', from: ['clear','handbrakeMkv'], to: 'storage'},
			{name: 'reset', from: 'ejectDisk', to: 'clear'},
			{name: 'reset', from: 'storage', to: 'clear'}			
		]
	};

	//Setup the opertions:
	function Setup() {
		// Nothing basic needs to be setup.
		this.io = {};
		this.udisks = udisks;
		this.redis_client = {};
		this.statemachine = {};
	}
	
	Setup.prototype.beforeAllEvents = function (event, from, to) {
		
		
		
		console.log('Redis...: ',util.inspect(this, {showHidden: false, depth: null, colors: true}));
		
		// Setup.redis_client.set('hammerview:general:current_event',to, function (err, res) {
// 			console.log('current_event_set:',res);
// 		});
		console.log('before all events...', event, from, to);
	};
	
	Setup.prototype.scan = function (event, from, to) {
		console.log('scan event...', event, from, to);
	};

	Setup.prototype.init = function (options) {

		var current_setup = this;

		// Setup Udisk:
		if (!_.isUndefined(options)) {
			
			// Setup Udisk:
			if (!_.isUndefined(options.drives) &&
				_.isArray(options.drives) &&
				options.drives.length >= 1)
			{
				console.log('udisks starting up...');
				udisks.driveFocus(options.drives, function(err, currentUdisk) {
					if (currentUdisk.device_info[0].drive_has_valid_media) {
						//statemachine.start();
						console.log('statemachine scan...');
						current_setup.statemachine.scan();
					}
				});
				udisks.interfaceAdded(current_setup.inter_added);
				udisks.interfaceRemoved(current_setup.inter_removed);
			}
			
			// Setup Socket.io:
			if (!_.isUndefined(options.socketio) &&
				_.isObject(options.socketio))
			{
				// Make sure we have the reference managed:
				current_setup.io = options.socketio;
				current_setup.io.sockets.on('connection', function (socket) {
				  socket.emit('hello', { hello: 'world' }); // Test message.
				  socket.on('my other event', function (data) {
				    console.log(data);
				  });
				});
			}
			
			// Setup Redis:
			if (!_.isUndefined(options.redis) &&
				_.isObject(options.redis))
			{
				var redis_port = 6379;
				var redis_host = "127.0.0.1";
				var redis_opts = {};
				if (_.isNumber(options.redis.port)) {
					redis_port = options.redis.port;
				}
				if (_.isString(options.redis.host)) {
					redis_host = options.redis.host;
				}
				if (_.isObject(options.redis.options)) {
					redis_opts = options.redis.options;
				}
				current_setup.redis_client = redis.createClient(redis_port, redis_host, redis_opts);
			} else {
				current_setup.redis_client = redis.createClient();
			}
			
			// Setup State Machine:
			console.log('Initial State Obj: ',util.inspect(stateObj, {showHidden: false, depth: null, colors: true}));
			this.statemachine = sm.create(stateObj);
			this.statemachine.onbeforeevent = current_setup.beforeAllEvents;
			this.statemachine.onscan = current_setup.scan;
			console.log(util.inspect(this.statemachine, {showHidden: false, depth: null, colors: true}));
			
			return this;
		}
		return null;
	};

	Setup.prototype.inter_added = function () {
		var name = 'app_interadded';
		var currentTime = new Date();
		console.log(currentTime, ' ** '+name+' ** Monitor\n');
		console.log(util.inspect(arguments, {showHidden: false, depth: null, colors: true}));
		
		// Set state:
	};

	Setup.prototype.inter_removed = function () {
		var name = 'app_interadded';
		var currentTime = new Date();
		console.log(currentTime, ' ** '+name+' ** Monitor\n');
		console.log(util.inspect(arguments, {showHidden: false, depth: null, colors: true}));
	};
	
	Setup.prototype.setState = function () {
		
	};
	
	// Setup.prototype.getCurrentState = function () {
	// 	// 1. Get Drive Information:
	// 	async.parallel([
	// 		function (callback) {
	// 			
	// 		}
	// 	
	// 	], function (err, results) {
	// 		
	// 	});
	// 	
	// };
	
	module.exports = new Setup();
})();