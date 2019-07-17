'use strict';

const Homey = require('homey');
const util = require('/lib/util.js');

class DoorbirdDevice extends Homey.Device {

  onInit() {
    new Homey.FlowCardTriggerDevice('doorbell').register();
    new Homey.FlowCardTriggerDevice('motionsensor').register();
    new Homey.FlowCardTriggerDevice('dooropen').register();

    // LISTENERS FOR UPDATING CAPABILITIES
    this.registerCapabilityListener('button', async (value, opts) => {
      try {
        var result = await util.sendCommand('/bha-api/open-door.cgi?r=1', this.getSetting('address'), this.getSetting('username'), this.getSetting('password'))
        if (result) {
          Homey.ManagerFlow.getCard('trigger', 'dooropen').trigger(this, {relay: '1'}, {});
        }
        return Promise.resolve(true);
      } catch (error) {
        return Promise.reject(error);
      }
    });

    // LIVE SNAPSHOT TOKEN
    this.doorbirdSnapShot = new Homey.Image();
    this.doorbirdSnapShot.setStream(async (stream) => {
      const res = await util.getStreamSnapshot('http://'+ this.getSetting('address') +'/bha-api/image.cgi', this.getSetting('username'), this.getSetting('password'));
      if(!res.ok)
        throw new Error('Invalid Response');

      return res.body.pipe(stream);
    });
    this.doorbirdSnapShot.register()
      .then(() => {
        return this.setCameraImage('doorbird', Homey.__('Live Snapshot'), this.doorbirdSnapShot);
      })
      .catch(this.error.bind(this, 'doorbirdSnapShot.register'));

    // DOORBELL SNAPSHOT TOKEN
    this.doorbellSnapShot = new Homey.Image();
    this.doorbellSnapShot.setStream(async (stream) => {
      const res = await util.getStreamSnapshot('http://'+ this.getSetting('address') +'/bha-api/history.cgi?event=doorbell&index=1', this.getSetting('username'), this.getSetting('password'));
      if(!res.ok)
        throw new Error('Invalid Response');

      return res.body.pipe(stream);
    });

    this.doorbellSnapShot.register()
      .then(() => {
        return this.setCameraImage('doorbell', Homey.__('Latest Doorbell Snapshot'), this.doorbellSnapShot);
      })
      .catch(this.error.bind(this, 'doorbellSnapShot.register'));

    // MOTION SNAPSHOT TOKEN
    this.motionsensorSnapShot = new Homey.Image();
    this.motionsensorSnapShot.setStream(async (stream) => {
      const res = await util.getStreamSnapshot('http://'+ this.getSetting('address') +'/bha-api/history.cgi?event=motionsensor&index=1', this.getSetting('username'), this.getSetting('password'));
      if(!res.ok)
        throw new Error('Invalid Response');

      return res.body.pipe(stream);
    });

    this.motionsensorSnapShot.register()
      .then(() => {
        return this.setCameraImage('motion', Homey.__('Latest Motionsensor Snapshot'), this.doorbirdSnapShot);
      })
      .catch(this.error.bind(this, 'motionsensorSnapShot.register'));

  }

}

module.exports = DoorbirdDevice;
