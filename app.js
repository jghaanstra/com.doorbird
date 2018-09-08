"use strict";

const Homey = require('homey');
const util = require('/lib/util.js');

class DoorbirdApp extends Homey.App {

  onInit() {
    this.log('Initializing DoorBird app ...');

    new Homey.FlowCardAction('emailsnapshot')
      .register()
      .registerRunListener((args) => {
        const emailSnapshot = async () => {
          const image = await util.createSnapshot(args.device.getSetting('address'), args.device.getSetting('username'), args.device.getSetting('password'))
          if (image) {
            return Promise.resolve(util.sendSnapshot(image, args));
          } else {
            throw new Error('Snapshot not created succesfully');
          }
        }
        emailSnapshot();
      });

    new Homey.FlowCardAction('emailsnapshothistory')
      .register()
      .registerRunListener((args) => {
        const emailHistorySnapshot = async () => {
          const image = await util.retrieveHistorySnapshot(args.device.getSetting('address'), args.device.getSetting('username'), args.device.getSetting('password'), args)
          if (image) {
            return Promise.resolve(util.sendHistorySnapshot(image, args));
          } else {
            throw new Error('Snapshot not retrieved succesfully');
          }
        }
        emailHistorySnapshot();
      });

    new Homey.FlowCardAction('light')
      .register()
      .registerRunListener((args) => { return Promise.resolve(util.sendCommand('/bha-api/light-on.cgi', args.device.getSetting('address'), args.device.getSetting('username'), args.device.getSetting('password'))) });

    new Homey.FlowCardAction('door')
      .register()
      .registerRunListener((args) => { return Promise.resolve(util.sendCommand('/bha-api/open-door.cgi', args.device.getSetting('address'), args.device.getSetting('username'), args.device.getSetting('password'))) });

    new Homey.FlowCardAction('ask_door')
      .register()
      .registerRunListener((args) => { return Promise.resolve(util.ask_door(args)) });

  }

}

module.exports = DoorbirdApp;
