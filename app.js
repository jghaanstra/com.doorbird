'use strict';

const Homey = require('homey');
const Util = require('/lib/util.js');

class DoorbirdApp extends Homey.App {

  onInit() {
    this.log('Initializing DoorBird app ...');

    if (!this.util) this.util = new Util({homey: this.homey});

    this.homey.flow.getActionCard('emailsnapshot')
      .registerRunListener(async (args) => {
        try {
          const image = await this.util.getBufferSnapshot('http://'+ args.device.getSetting('address') +'/bha-api/image.cgi', args.device.getSetting('username'), args.device.getSetting('password'), 'buffer');
          return await this.util.sendSnapshot(image, args);
        } catch (error) {
          return Promise.reject(error);
        }
      });

    this.homey.flow.getActionCard('emailsnapshothistory')
      .registerRunListener(async (args) => {
        try {
          const image = await util.getBufferSnapshot('http://'+ args.device.getSetting('address') +'/bha-api/history.cgi?event='+ args.source +'&index='+ args.history +'', args.device.getSetting('username'), args.device.getSetting('password'), 'buffer');
          return await this.util.sendHistorySnapshot(image, args);
        } catch (error) {
          return Promise.reject(error);
        }
      });

    this.homey.flow.getActionCard('light')
      .registerRunListener(async (args) => {
        return await this.util.sendCommand('/bha-api/light-on.cgi', args.device.getSetting('address'), args.device.getSetting('username'), args.device.getSetting('password'));
      });

    this.homey.flow.getActionCard('door')
      .registerRunListener(async (args) => {
        if(args.relay.id) {
          return await this.util.sendCommand('/bha-api/open-door.cgi?r='+ args.relay.id, args.device.getSetting('address'), args.device.getSetting('username'), args.device.getSetting('password'));
        } else {
          return await this.util.sendCommand('/bha-api/open-door.cgi', args.device.getSetting('address'), args.device.getSetting('username'), args.device.getSetting('password'), args.relay.id);
        }
      })
      .getArgument('relay')
        .registerAutocompleteListener(async (query, args) => {
          return await this.util.getRelays(args.device.getSetting('address'), args.device.getSetting('username'), args.device.getSetting('password'));
        })

    this.homey.flow.getActionCard('ask_door')
      .registerRunListener(async (args) => {
        return await this.util.askDoor(args);
      });

  }

}

module.exports = DoorbirdApp;
