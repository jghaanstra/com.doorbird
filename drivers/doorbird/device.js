'use strict';

const Homey = require('homey');
const util = require('/lib/util.js');

class DoorbirdDevice extends Homey.Device {

  onInit() {
    new Homey.FlowCardTriggerDevice('doorbell').register();
    new Homey.FlowCardTriggerDevice('motionsensor').register();
    new Homey.FlowCardTriggerDevice('dooropen').register();

    // LIVE SNAPSHOT TOKEN
    this.doorbirdSnapShot = new Homey.Image();
    this.doorbirdSnapShot.setStream(async (stream) => {
      const res = await util.streamSnapshot('http://'+ this.getSetting('address') +'/bha-api/image.cgi', this.getSetting('username'), this.getSetting('password'));
      if(!res.ok)
        throw new Error('Invalid Response');

      return res.body.pipe(stream);
    });
    this.doorbirdSnapShot.register()
      .then(() => {
        let doorbirdSnapShotToken = new Homey.FlowToken('doorbird_snapshot', {
          type: 'image',
          title: Homey.__('Live Snapshot')
        })
        doorbirdSnapShotToken
          .register()
          .then(() => {
            doorbirdSnapShotToken.setValue(this.doorbirdSnapShot);
          })
          .catch(this.error.bind(this, 'doorbirdSnapShotToken.register'));

        return this.setCameraImage('doorbird',  Homey.__('Live Snapshot'), this.doorbirdSnapShot);

      })
      .catch(this.error.bind(this, 'doorbirdSnapShot.register'));

    // DOORBELL SNAPSHOT TOKEN
    this.doorbellSnapShot = new Homey.Image();
    this.doorbellSnapShot.setStream(async (stream) => {
      const res = await util.streamSnapshot('http://'+ this.getSetting('address') +'/bha-api/history.cgi?event=doorbell&index=1', this.getSetting('username'), this.getSetting('password'));
      if(!res.ok)
        throw new Error('Invalid Response');

      return res.body.pipe(stream);
    });

    this.doorbellSnapShot.register()
      .then(() => {
        let doorbellSnapShotToken = new Homey.FlowToken('doorbell_snapshot', {
          type: 'image',
          title: Homey.__('Latest Doorbell Snapshot')
        })
        doorbellSnapShotToken
          .register()
          .then(() => {
            doorbellSnapShotToken.setValue(this.doorbellSnapShot);
          })
          .catch(this.error.bind(this, 'doorbellSnapShotToken.register'));

        return this.setCameraImage('doorbell',  Homey.__('Latest Doorbell Snapshot'), this.doorbellSnapShot);

      })
      .catch(this.error.bind(this, 'doorbellSnapShot.register'));

    // MOTION SNAPSHOT TOKEN
    this.motionsensorSnapShot = new Homey.Image();
    this.motionsensorSnapShot.setStream(async (stream) => {
      const res = await util.streamSnapshot('http://'+ this.getSetting('address') +'/bha-api/history.cgi?event=motionsensor&index=1', this.getSetting('username'), this.getSetting('password'));
      if(!res.ok)
        throw new Error('Invalid Response');

      return res.body.pipe(stream);
    });

    this.motionsensorSnapShot.register()
      .then(() => {
        let motionsensorSnapShotToken = new Homey.FlowToken('motionsensor_snapshot', {
          type: 'image',
          title: Homey.__('Latest Motionsensor Snapshot')
        })
        motionsensorSnapShotToken
          .register()
          .then(() => {
            motionsensorSnapShotToken.setValue(this.motionsensorSnapShot);
          })
          .catch(this.error.bind(this, 'motionsensorSnapShotToken.register'));

      })
      .catch(this.error.bind(this, 'motionsensorSnapShot.register'));

  }

}

module.exports = DoorbirdDevice;
