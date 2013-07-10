(function () {
	
	var async = require('async');
	var dbusn = require('dbus-native');
	var _ = require('underscore');
	var util = require('util');
	var path = require('path');
	
	var media_optical = /optical_(dvd|bd)/im;
	
	function UdisksManager() {
		// Set up DBus:
		var bus = dbusn.systemBus();
		this.service = bus.getService('org.freedesktop.UDisks2');
		this.device_info = [];
	};

	UdisksManager.prototype.driveFocus = function(drives, callback) {
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
			
			this.driveUpdate(callback);
		} else {
			throw new Error('UdisksManager :: Drives array not supplied.');
		}
	};

	UdisksManager.prototype.driveUpdate = function (drive_update_callback) {
		var current_udisk = this;
		if (current_udisk.device_info.length >= 1){
			
			async.each(current_udisk.device_info, function (item, callback) {
				console.log('Item Info: ',util.inspect(item, {showHidden: false, depth: null, colors: true}));
				
				current_udisk.deviceCollect(item.udisk_block_object, function (err, device_info_collected) {
					if (!_.isNull(err)) {
						console.log(util.inspect(err, {showHidden: false, depth: null, colors: true}));
					}
					var device_info_id = current_udisk.getDeviceUdiskBlockObject(device_info_collected.udisk_block_object);
					if(device_info_id > -1){
						for (key in device_info_collected) {
							current_udisk.device_info[device_info_id][key] = device_info_collected[key];
						}
					}
					console.log(util.inspect(current_udisk.device_info, {showHidden: false, depth: null, colors: true}));
					callback(null);
				});
			}, function (err) {
				if (!_.isNull(err)) {
					console.log(util.inspect(err, {showHidden: false, depth: null, colors: true}));
				}
				if (_.isFunction(drive_update_callback)) {
					drive_update_callback(err, current_udisk);
				}
			});
			
		}
	};
	
	UdisksManager.prototype.deviceCollect = function(input_udisk_block_object, device_info_handler) {
		var device_info = {};
		device_info.udisk_block_object = input_udisk_block_object;
		var udisk_manager = this;
		
		udisk_manager.service.getInterface(input_udisk_block_object, 'org.freedesktop.DBus.Properties', function (err, blockProperties) {
			blockProperties.Get('org.freedesktop.UDisks2.Block', 'Drive', function (err, blockDriveProperty) {
				//console.log('BlockDriveProp: ',util.inspect(blockDriveProperty, {showHidden: false, depth: null, colors: true}));
				device_info.drive_property = blockDriveProperty[1][0];
				udisk_manager.service.getInterface(device_info.drive_property, 'org.freedesktop.DBus.Properties', function (err, driveProperties) {
					async.parallel([
						function (callback) {
							driveProperties.Get('org.freedesktop.UDisks2.Drive', 'Id', function (err, driveIdProperty) {
								device_info.id_label = driveIdProperty[1][0];
								callback(null);
							});	
						},
						function (callback) {
							driveProperties.Get('org.freedesktop.UDisks2.Drive', 'Model', function (err, driveModelProperty) {
								device_info.model = driveModelProperty[1][0];
								callback(null);
							});	
						},
						function (callback) {
							driveProperties.Get('org.freedesktop.UDisks2.Drive', 'Serial', function (err, driveSerialProperty) {
								device_info.serial = driveSerialProperty[1][0];
								callback(null);
							});	
						},
						function (callback) {
							driveProperties.Get('org.freedesktop.UDisks2.Drive', 'MediaAvailable', function (err, driveMediaAvailableProperty) {
								device_info.media_available = driveMediaAvailableProperty[1][0];
								callback(null);
							});	
						},
						function (callback) {
							driveProperties.Get('org.freedesktop.UDisks2.Drive', 'Media', function (err, driveMediaProperty) {
								device_info.media = driveMediaProperty[1][0];
								callback(null);
							});	
						},
						function (callback) {
							driveProperties.Get('org.freedesktop.UDisks2.Drive', 'MediaRemovable', function (err, driveRemovableProperty) {
								device_info.media_removable = driveRemovableProperty[1][0];
								callback(null);
							});	
						},
						function (callback) {
							driveProperties.Get('org.freedesktop.UDisks2.Drive', 'MediaCompatibility', function (err, driveMediaCompatProperty) {
								device_info.media_compatibility = driveMediaCompatProperty[1][0];
								callback(null);
							});	
						},
						function (callback) {
							driveProperties.Get('org.freedesktop.UDisks2.Drive', 'Optical', function (err, driveOpticalProperty) {
								device_info.optical = driveOpticalProperty[1][0];
								callback(null);
							});	
						},
						function (callback) {
							driveProperties.Get('org.freedesktop.UDisks2.Drive', 'OpticalBlank', function (err, driveOpticalBlankProperty) {
								device_info.optical_blank = driveOpticalBlankProperty[1][0];
								callback(null);
							});	
						},
						function (callback) {
							driveProperties.Get('org.freedesktop.UDisks2.Drive', 'Removable', function (err, driveRemovableProperty) {
								device_info.removable = driveRemovableProperty[1][0];
								callback(null);
							});	
						},
						function (callback) {
							driveProperties.Get('org.freedesktop.UDisks2.Drive', 'Ejectable', function (err, driveEjectableProperty) {
								device_info.ejectable = driveEjectableProperty[1][0];
								callback(null);
							});	
						}
					],
					function (err, results) {
						if (device_info.media_available == 1 &&
							device_info.optical == 1 &&
							device_info.media_removable == 1 &&
							media_optical.test(device_info.media))
						{
							device_info.drive_has_valid_media = true;
						} else if(device_info.media_available == 0 &&
								  device_info.media === '')
						{
							device_info.drive_has_valid_media = false;
						}
						
						if (device_info.optical == 1 &&
							device_info.optical_blank == 1)
						{
							device_info.drive_has_blank_media = true;
						} else {
							device_info.drive_has_blank_media = false;
						}

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
						current_udisk.driveUpdate(callback);
					}

				});
			});
		} else {
			throw new Error('UdisksManager :: interfaceRunner() :: Action: ' + interfaceAction + ' Error: Action and/or Callback not supplied.');
		}
	};

	module.exports = new UdisksManager();
})();
