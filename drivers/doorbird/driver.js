"use strict";

const Homey = require('homey');
const util = require('/lib/util.js');

class DoorbirdDriver extends Homey.Driver {

  onPair(socket) {
    const discoveryStrategy = this.getDiscoveryStrategy();
    const discoveryResults = discoveryStrategy.getDiscoveryResults();
    let selectedDeviceId;
    let deviceArray = {};

    socket.on('list_devices', (data, callback) => {
      const devices = Object.values(discoveryResults).map(discoveryResult => {
        return {
          name: 'DoorBird ['+ discoveryResult.address +']',
          data: {
            id: discoveryResult.id,
          }
        };
      });
      callback(null, devices);
    });

    socket.on('list_devices_selection', (data, callback) => {
      callback();
      selectedDeviceId = data[0].data.id;
    });

    socket.on('login', (data, callback) => {
      const discoveryResult = discoveryResults[selectedDeviceId];
      if(!discoveryResult) return callback(new Error('Something went wrong'));

      util.sendCommand('/bha-api/info.cgi', discoveryResult.address, data.username, data.password)
        .then(body => {
          var password = data.password;
          deviceArray = {
            name: 'DoorBird ['+ discoveryResult.address +']',
            data: {
              id: discoveryResult.id,
            },
            settings: {
              address  : discoveryResult.address,
              username : data.username,
              password : data.password
            },
            store: {
              type: body.BHA.VERSION[0]["DEVICE-TYPE"],
              intercomid: password.substr(0, 6),
              relay: body.BHA.VERSION[0].RELAYS
            }
          }
          callback(null, true);
        })
        .catch(error => {
          callback(error, false);
        });
    });

    socket.on('get_device', (data, callback) => {
      callback(false, deviceArray);
    });

  }

}

module.exports = DoorbirdDriver;
