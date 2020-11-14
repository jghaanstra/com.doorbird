'use strict';

const Homey = require('homey');
const Util = require('/lib/util.js');

class DoorbirdDriver extends Homey.Driver {

  onInit() {
    if (!this.util) this.util = new Util({homey: this.homey});

    this.homey.flow.getDeviceTriggerCard('doorbell');
    this.homey.flow.getDeviceTriggerCard('motionsensor');
    this.homey.flow.getDeviceTriggerCard('dooropen');
  }

  onPair(session) {
    const discoveryStrategy = this.getDiscoveryStrategy();
    const discoveryResults = discoveryStrategy.getDiscoveryResults();
    let selectedDeviceId;
    let deviceArray = {};

    session.setHandler('list_devices', async (data) => {
      const devices = Object.values(discoveryResults).map(discoveryResult => {
        return {
          name: 'DoorBird ['+ discoveryResult.address +']',
          data: {
            id: discoveryResult.id,
          }
        };
      });
      return devices;
    });

    session.setHandler('login', async (data) => {
      try {
        const discoveryResult = discoveryResults[selectedDeviceId];
        if(!discoveryResult) throw new Error('Something went wrong');

        const result = await this.util.sendCommand('/bha-api/info.cgi', discoveryResult.address, data.username, data.password);
        if (result) {
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
              type: result.BHA.VERSION[0]["DEVICE-TYPE"],
              intercomid: password.substr(0, 6),
              relay: result.BHA.VERSION[0].RELAYS
            }
          }
        }
        return Promise.resolve(true);
      } catch (error) {
        return Promise.reject(error);
      }
    });

    session.setHandler('list_devices_selection', async (data) => {
      return selectedDeviceId = data[0].data.id;
    });

    session.setHandler('add_device', async (data) => {
      return Promise.resolve(deviceArray);
    });

  }

}

module.exports = DoorbirdDriver;
