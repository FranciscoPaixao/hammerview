(function () {
	
	var async = require('async');
	var dbusn = require('dbus-native');
	var _ = require('underscore');
	var util = require('util');
	var path = require('path');
	
	function UdisksManager() {
		// Set up DBus:
		var bus = dbusn.systemBus();
		this.service = bus.getService('org.freedesktop.UDisks2');
		this.device_info = [];
	};

	UdisksManager.prototype.driveFocus = function(drives) {
		if (!_.isUndefined(drives) && _.isArray(drives) && drives.length >= 1)
		{
			var current_udisk = this;
			var device_base_path = '/dev';
			var udisk_block_base_path = '/org/freedesktop/UDisks2/block_devices';
			
			for(var i=0;i<drives.length;i++) {
				var tempDevInfo = {};
				tempDevInfo.device_name = '';
				tempDevInfo.udisk_block_object = '';
				
				if (path.dirname(drives[i]) === device_base_path) {
					tempDevInfo.device_name = drives[i];
					tempDevInfo.udisk_block_object = path.join(udisk_block_base_path, path.basename(drives[i]));
				} else if (path.dirname(drives[i]) === udisk_block_base_path) {
					tempDevInfo.device_name = path.join(device_base_path, path.basename(drives[i]));
					tempDevInfo.udisk_block_object = drives[i];
				}
				current_udisk.device_info.push(tempDevInfo);
			}
			
			this.driveUpdate();
		} else {
			throw new Error('UdisksManager :: Drives array not supplied.');
		}
	};

	UdisksManager.prototype.driveUpdate = function () {
		var current_udisk = this;
		if (current_udisk.device_info.length >= 1){
			
			for(var i=0;i<current_udisk.device_info.length;i++) {
				console.log(util.inspect(current_udisk.device_info[i], {showHidden: false, depth: null, colors: true}));
				
				current_udisk.deviceCollect(current_udisk.device_info[i].udisk_block_object, function (err, device_info_collected) {
					var device_info_id = current_udisk.getDeviceUdiskBlockObject(device_info_collected.udisk_block_object);
					if(device_info_id > -1 && device_info_collected.removable && device_info_collected.ejectable){
						current_udisk.device_info[device_info_id].removable = device_info_collected.removable;
						current_udisk.device_info[device_info_id].ejectable = device_info_collected.ejectable;
					}
					console.log(util.inspect(current_udisk.device_info, {showHidden: false, depth: null, colors: true}));
				});
			}
			
		}
	};

	UdisksManager.prototype.deviceCollect = function(input_udisk_block_object, device_info_handler) {
		var device_info = {};
		device_info.udisk_block_object = input_udisk_block_object;
		var udisk_manager = this;
		
		udisk_manager.service.getInterface(input_udisk_block_object, 'org.freedesktop.DBus.Properties', function (err, blockProperties) {
			blockProperties.Get('org.freedesktop.UDisks2.Block', 'Drive', function (err, blockDriveProperty) {
				//console.log(util.inspect(blockDriveProperty, {showHidden: false, depth: null, colors: true}));
				device_info.drive_property = blockDriveProperty[1][0];
				udisk_manager.service.getInterface(device_info.drive_property, 'org.freedesktop.DBus.Properties', function (err, driveProperties) {
					async.parallel([
							function (callback) {
								driveProperties.Get('org.freedesktop.UDisks2.Drive', 'Id', function (err, driveIdProperty) {
									//console.log(driveIdProperty);
									device_info.id_label = driveIdProperty[1][0];
									callback(null);
								});	
							},
							function (callback) {
								driveProperties.Get('org.freedesktop.UDisks2.Drive', 'MediaAvailable', function (err, driveMediaAvailableProperty) {
									//console.log(driveMediaAvailableProperty);
									device_info.media_available = driveMediaAvailableProperty[1][0];
									callback(null);
								});	
							},
							function (callback) {
								driveProperties.Get('org.freedesktop.UDisks2.Drive', 'Media', function (err, driveMediaProperty) {
									//console.log(driveMediaProperty);
									device_info.media = driveMediaProperty[1][0];
									callback(null);
								});	
							},
							function (callback) {
								driveProperties.Get('org.freedesktop.UDisks2.Drive', 'MediaCompatibility', function (err, driveMediaCompatProperty) {
									//console.log(driveMediaCompatProperty);
									device_info.media_compatibility = driveMediaCompatProperty[1][0];
									callback(null);
								});	
							},
							function (callback) {
								driveProperties.Get('org.freedesktop.UDisks2.Drive', 'Optical', function (err, driveOpticalProperty) {
									//console.log(driveOpticalProperty);
									device_info.optical = driveOpticalProperty[1][0];
									callback(null);
								});	
							},
							function (callback) {
								driveProperties.Get('org.freedesktop.UDisks2.Drive', 'OpticalBlank', function (err, driveOpticalBlankProperty) {
									//console.log(driveOpticalBlankProperty);
									device_info.optical_blank = driveOpticalBlankProperty[1][0];
									callback(null);
								});	
							},
							function (callback) {
								driveProperties.Get('org.freedesktop.UDisks2.Drive', 'Removable', function (err, driveRemovableProperty) {
									//console.log(driveRemovableProperty);
									device_info.removable = driveRemovableProperty[1][0];
									callback(null);
								});	
							},
							function (callback) {
								driveProperties.Get('org.freedesktop.UDisks2.Drive', 'Ejectable', function (err, driveEjectableProperty) {
									//console.log(driveEjectableProperty);
									device_info.ejectable = driveEjectableProperty[1][0];
									callback(null);
								});	
							}
						],
					function (err, results) {
						device_info_handler(err, device_info);
					});
				});
			});
		});
	};

	UdisksManager.prototype.verifyDevice = function (device) {
		if (this.device_info.length >= 1){
			// Verify this message is for one of the drives of interest:
			var device_verified = false;
			for(var i=0;i<this.device_info.length;i++){
				if (this.device_info[i].udisk_block_object === device) {
					device_verified = true;
					break;
				}
			}
			
			return device_verified;
		}
		
		return false;
	};
	
	UdisksManager.prototype.getDeviceUdiskBlockObject = function (device) {
		if (this.device_info.length >= 1){
			// Verify this message is for one of the drives of interest:
			var device_id = -1;
			for(var i=0;i<this.device_info.length;i++){
				if (this.device_info[i].udisk_block_object === device) {
					device_id = i;
					break;
				}
			}
			
			return device_id;
		}
		
		return -1;
	};
	
	UdisksManager.prototype.getDeviceDeviceName = function (device) {
		if (this.device_info.length >= 1){
			// Verify this message is for one of the drives of interest:
			var device_id = -1;
			for(var i=0;i<this.device_info.length;i++){
				if (this.device_info[i].device_name === device) {
					device_id = i;
					break;
				}
			}
			
			return device_id;
		}
		
		return -1;
	};

	UdisksManager.prototype.interfaceAdded = function (callback) {
		this.interfaceRunner('Add', callback);
	};

	UdisksManager.prototype.interfaceRemoved = function (callback) {
		this.interfaceRunner('Remove', callback);
	};

	UdisksManager.prototype.interfaceRunner = function (interfaceAction, callback) {
		if (!_.isUndefined(interfaceAction) && _.isString(interfaceAction) &&
			!_.isUndefined(callback) && _.isFunction(callback)) {
			
			var action = '';
			var interAdd = /InterfacesAdded|Added|Add/i;
			var interRemove = /InterfacesRemoved|Removed|Remove/i;
			if (interAdd.test(interfaceAction)) {
				action = 'InterfacesAdded';
			} else if (interRemove.test(interfaceAction)) {
				action = 'InterfacesRemoved';
			} else {
				throw new Error('UdisksManager :: interfaceRunner() :: Error: Improper action name supplied. Action Supplied: ' + interfaceAction);
			}
			
			var current_udisk = this;
			current_udisk.service.getInterface('/org/freedesktop/UDisks2',
									  'org.freedesktop.DBus.ObjectManager',
									  function (err, mainUdisksProperties) {
		
				mainUdisksProperties.on(action, function interfaceAddedWrapper(device, interface) {
					var name = 'UdisksManager :: Running Interface Action: ' + action;
					var currentTime = new Date();
					console.log(currentTime, ' ** '+name+' ** Monitor\n');
					console.log(util.inspect(arguments, {showHidden: false, depth: null, colors: true}));
					
					if (current_udisk.verifyDevice(device)) {
						current_udisk.deviceCollect(device, callback);
					} else {
						callback(device);
					}

				});
			});
		} else {
			throw new Error('UdisksManager :: interfaceRunner() :: Action: ' + interfaceAction + ' Error: Action and/or Callback not supplied.');
		}
	};

	module.exports = new UdisksManager();
})();

