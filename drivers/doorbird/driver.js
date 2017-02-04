"use strict";

var utils = require('/lib/utils.js');
var request = require('request');
var doorbirds = {};

/* HELPER FUNCTIONS */
function initDevice(device_data) {
    Homey.manager('drivers').getDriver('doorbird').getName(device_data, function (err, name) {
        if (err) return
        doorbirds[device_data.id] = {
            name: name
        }
        module.exports.getSettings(device_data, function (err, settings) {
            doorbirds[device_data.id].settings = settings;
        });
    });
}

/* SELF */
var self = {
    init: function (devices_data, callback) {
        devices_data.forEach(function(device_data) {
            initDevice(device_data);
    	});

    	callback (null, true);
    },
    pair: function (socket) {
        socket.on('disconnect', function() {
            Homey.log ("User aborted pairing, or pairing is finished");
        });

        socket.on('testConnection', function( device_data, callback ) {
            var address = device_data.address;
            var user    = device_data.username;
            var pass    = device_data.password;

            var options = {
                url: "http://"+ address +"/bha-api/info.cgi",
                auth: {
                    username: user,
                    password: pass
                },
                timeout: 1000
            };

            request(options, function (error, response, body) {
                var code = 504;
                if(response) {
                    var code = response.statusCode;
                }

                if (error) {
                    callback( error, false );
                } else if (code == 200) {
                    var info = JSON.parse(body);
                    utils.createSnapshot(device_data, function( error, image ) {
                        if(error) {
                            callback( error, false );
                        } else {
                            callback( false, { image: image, info: info.BHA.VERSION[0] } );
                        }
                    });
                } else {
                    callback( code, false );
                }
            });

        });

        socket.on('add_device', function( device_data, callback ){
            initDevice( device_data );
            callback( null, true );
        });
    },
    deleted: function (device_data, callback) {
        delete doorbirds[ device_data.id ];
        callback( null, true );
    },
    settings: function (device_data, newSettingsObj, oldSettingsObj, changedKeysArr, callback) {
        Homey.log ('Doorbird changed settings: ' + JSON.stringify(device_data) + ' / ' + JSON.stringify(newSettingsObj) + ' / old = ' + JSON.stringify(oldSettingsObj));

        try {
            changedKeysArr.forEach(function (key) {
                doorbirds[device_data.id].settings[key] = newSettingsObj[key]
            })
            callback(null, true)
        } catch (error) {
            callback(error)
        }
    },
    getDoorbirds: function() {
        return doorbirds;
    },
    setNotifications: function(callback, relaxationdb, relaxationms) {
        utils.getHomeyIp(function (homeyaddress) {
            if(homeyaddress) {
                utils.updateNotifications(callback, homeyaddress, relaxationdb, relaxationms);
            }
        })
    }
}

module.exports = self
