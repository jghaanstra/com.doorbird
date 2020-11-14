'use strict';

const Homey = require('homey');
const Util = require('/lib/util.js');

class DoorbirdDevice extends Homey.Device {

  async onInit() {
    if (!this.util) this.util = new Util({homey: this.homey});

    // FIX NOTIFICATION URLS FOR A MORE GENERIC SETUP, REMOVES THIS AFTER SOME UPDATES
    // TODO: REMOVE AFTER 3.1.0
    await this.util.updateNotifications(this.getSetting('address'), this.getSetting('username'), this.getSetting('password'), this.getData().id, 'add');

    // INITIALLY SET DEVICE AS AVAILABLE
    this.setAvailable();

    // REMOVE CAPABILITIES
    // TODO: REMOVE AFTER 3.1.0
    if (this.hasCapability('button')) {
      this.removeCapability('button');
    }
    if (!this.hasCapability('button.notificationevents') ) {
      this.addCapability('button.notificationevents');
    }
    if (!this.hasCapability('button.removenotificationevents') ) {
      this.addCapability('button.removenotificationevents');
    }
    if (!this.hasCapability('open_action')) {
      this.addCapability('open_action');
    }

    // LISTENERS FOR UPDATING CAPABILITIES
    this.registerCapabilityListener('open_action', async (value) => {
      try {
        if (value === 1) {
          const result = await this.util.sendCommand('/bha-api/open-door.cgi?r=1', this.getSetting('address'), this.getSetting('username'), this.getSetting('password'))
          await this.homey.flow.getDeviceTriggerCard('dooropen').trigger(this, {relay: '1'}, {});
          setTimeout(async () => {
            return this.setCapabilityValue('open_action', 0);
          }, 1000);
        } else {
          return Promise.resolve(true);
        }
      } catch (error) {
        return Promise.reject(error);
      }
    });

    this.registerCapabilityListener('button.notificationevents', async () => {
      return await this.util.updateNotifications(this.getSetting('address'), this.getSetting('username'), this.getSetting('password'), this.getData().id, 'add');
    });

    this.registerCapabilityListener('button.removenotificationevents', async () => {
      return await this.util.updateNotifications(this.getSetting('address'), this.getSetting('username'), this.getSetting('password'), this.getData().id, 'remove');
    });

    // LIVE SNAPSHOT TOKEN
    this.doorbirdSnapShot = await this.homey.images.createImage();
    this.doorbirdSnapShot.setStream(async (stream) => {
      const res = await this.util.getStreamSnapshot('http://'+ this.getSetting('address') +'/bha-api/image.cgi', this.getSetting('username'), this.getSetting('password'));
      if(!res.ok)
        throw new Error('Invalid Response');

      if(res.status == 204)
        throw new Error(this.homey.__('device.incorrect_permissions'));

      return res.body.pipe(stream);
    });
    await this.setCameraImage('doorbird', this.homey.__("device.live_snapshot"), this.doorbirdSnapShot);

    // DOORBELL SNAPSHOT TOKEN
    this.doorbellSnapShot = await this.homey.images.createImage();
    this.doorbellSnapShot.setStream(async (stream) => {
      const res = await this.util.getStreamSnapshot('http://'+ this.getSetting('address') +'/bha-api/history.cgi?event=doorbell&index=1', this.getSetting('username'), this.getSetting('password'));
      if(!res.ok)
        throw new Error('Invalid Response');

      if(res.status == 204)
        throw new Error(this.homey.__('device.incorrect_permissions'));

      return res.body.pipe(stream);
    });
    await this.setCameraImage('doorbell', this.homey.__("device.latest_doorbell_snapshot"), this.doorbellSnapShot);

    // MOTION SNAPSHOT TOKEN
    this.motionsensorSnapShot = await this.homey.images.createImage();
    this.motionsensorSnapShot.setStream(async (stream) => {
      const res = await this.util.getStreamSnapshot('http://'+ this.getSetting('address') +'/bha-api/history.cgi?event=motionsensor&index=1', this.getSetting('username'), this.getSetting('password'));
      if(!res.ok)
        throw new Error('Invalid Response');

      if(res.status == 204)
        throw new Error(this.homey.__('device.incorrect_permissions'));

      return res.body.pipe(stream);
    });
    await this.setCameraImage('motion', this.homey.__("device.latest_motionsensor_snapshot"), this.motionsensorSnapShot);

  }

  async onAdded() {
    return await this.util.updateNotifications(this.getSetting('address'), this.getSetting('username'), this.getSetting('password'), this.getData().id, 'add');
  }

  async processEventTrigger(source, relay) {
    try {
      switch(source) {
        case 'doorbell':
          this.setCapabilityValue('alarm_generic', true);
          await this.doorbirdSnapShot.update();
          this.homey.flow.getDeviceTriggerCard('doorbell').trigger(this, {snapshot: this.doorbirdSnapShot}, {}); // using live snapshot as DoorBird Cloud does not update fast enough to retrieve latest doorbell snapshot
          await this.doorbellSnapShot.update();
          setTimeout(() => { this.setCapabilityValue('alarm_generic', false); }, 10000);
          return Promise.resolve(true);
          break;
        case 'motionsensor':
          this.setCapabilityValue('alarm_motion', true);
          await this.doorbirdSnapShot.update();
          this.homey.flow.getDeviceTriggerCard('motionsensor').trigger(this, {snapshot: this.doorbirdSnapShot}, {}); // using live snapshot as DoorBird Cloud does not update fast enough to retrieve latest history snapshot
          await this.motionsensorSnapShot.update();
          setTimeout(() => { this.setCapabilityValue('alarm_motion', false); }, 5000);
          return Promise.resolve(true);
          break;
        case 'relays':
          const result = await this.homey.flow.getDeviceTriggerCard('dooropen').trigger(this, {relay: relay}, {});
          return result;
          break;
        default:
          return Promise.reject('Invalid source');
          break;
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }

}

module.exports = DoorbirdDevice;
