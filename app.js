"use strict";

const Homey = require('homey');
const util = require('/lib/util.js');

class DoorbirdApp extends Homey.App {

  onInit() {
    this.log('Initializing DoorBird app ...');

    new Homey.FlowCardAction('emailsnapshot')
      .register()
      .registerRunListener(async (args) => {
        const image = await util.getBufferSnapshot('http://'+ args.device.getSetting('address') +'/bha-api/image.cgi', args.device.getSetting('username'), args.device.getSetting('password'));
        if (image) {
          return util.sendSnapshot(image, args);
        } else {
          throw new Error('Snapshot not created succesfully');
        }
      });

    new Homey.FlowCardAction('emailsnapshothistory')
      .register()
      .registerRunListener(async (args) => {
        const image = await util.getBufferSnapshot('http://'+ args.device.getSetting('address') +'/bha-api/history.cgi?event='+ args.source +'&index='+ args.history +'', args.device.getSetting('username'), args.device.getSetting('password'));

        if (image) {
          return util.sendHistorySnapshot(image, args);
        } else {
          throw new Error('Snapshot not retrieved succesfully');
        }
      });

    new Homey.FlowCardAction('light')
      .register()
      .registerRunListener((args) => { return Promise.resolve(util.sendCommand('/bha-api/light-on.cgi', args.device.getSetting('address'), args.device.getSetting('username'), args.device.getSetting('password'))) });

    new Homey.FlowCardAction('door')
      .register()
      .registerRunListener((args) => {
        if(args.relay.id) {
          return util.sendCommand('/bha-api/open-door.cgi?r='+ args.relay.id, args.device.getSetting('address'), args.device.getSetting('username'), args.device.getSetting('password'));
        } else {
          return util.sendCommand('/bha-api/open-door.cgi', args.device.getSetting('address'), args.device.getSetting('username'), args.device.getSetting('password'), args.relay.id);
        }
      })
      .getArgument('relay')
        .registerAutocompleteListener(( query, args ) => {
          return util.getRelays(args.device.getSetting('address'), args.device.getSetting('username'), args.device.getSetting('password'));
        })

    new Homey.FlowCardAction('ask_door')
      .register()
      .registerRunListener((args) => { return util.ask_door(args) });

  }

}

module.exports = DoorbirdApp;
