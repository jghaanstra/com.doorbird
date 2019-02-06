'use strict';

const Homey = require('homey');
const util = require('/lib/util.js');

class DoorbirdDevice extends Homey.Device {

  onInit() {
    new Homey.FlowCardTriggerDevice('doorbell').register();
    new Homey.FlowCardTriggerDevice('motionsensor').register();
    new Homey.FlowCardTriggerDevice('dooropen').register();

    // ADD NEW STORE VALUE FOR DEVICE PAIRED BEFORE APP VERSION 2.2.0
    if (!this.getStoreValue('intercomid')) {
      var username = this.getSetting('username');
      this.setStoreValue('intercomid', username.substr(0, 6));
    }

    // LIVE SNAPSHOT TOKEN
    let doorbirdSnapShot = new Homey.Image('jpg');
    doorbirdSnapShot.setBuffer(() => {
      this.log('setting buffer');
      const createSnapshot = async () => {
        try {
          const image = await util.createSnapshot(this.getSetting('address'), this.getSetting('username'), this.getSetting('password'))
          if (image) {
            return image;
          } else {
            throw new Error('Invalid Response');
          }
        } catch(error) {
          this.error(error);
          throw new Error('Invalid Response');
        }
      }
      createSnapshot();
    });

    doorbirdSnapShot.register()
      .then(() => {
        let doorbirdSnapShotToken = new Homey.FlowToken('doorbird_snapshot', {
          type: 'image',
          title: Homey.__('Live Snapshot')
        })

        doorbirdSnapShotToken
          .register()
          .then(() => {
            doorbirdSnapShotToken.setValue(doorbirdSnapShot);
          })
          .catch(this.error.bind(this, 'doorbirdSnapShotToken.register'));

      })
      .catch(this.error.bind(this, 'doorbirdSnapShot.register'));

    // DOORBELL SNAPSHOT TOKEN
    let doorbellSnapShot = new Homey.Image('jpg');
    doorbellSnapShot.setBuffer(() => {
      const createDoorbellSnapshot = async () => {
        try {
          var data = {
            source: 'doorbell',
            history: '1'
          }
          const image = await util.retrieveHistorySnapshot(this.getSetting('address'), this.getSetting('username'), this.getSetting('password'), data)
          if (image) {
            return image;
          } else {
            throw new Error('Invalid Response');
          }
        } catch(error) {
          this.error(error);
          throw new Error('Invalid Response');
        }
      }
      createDoorbellSnapshot();
    });

    doorbellSnapShot.register()
      .then(() => {
        let doorbellSnapShotToken = new Homey.FlowToken('doorbell_snapshot', {
          type: 'image',
          title: Homey.__('Latest Doorbell Snapshot')
        })

        doorbellSnapShotToken
          .register()
          .then(() => {
            doorbellSnapShotToken.setValue(doorbellSnapShot);
          })
          .catch(this.error.bind(this, 'doorbellSnapShotToken.register'));

      })
      .catch(this.error.bind(this, 'doorbellSnapShot.register'));

    // MOTION SNAPSHOT TOKEN
    let motionsensorSnapShot = new Homey.Image('jpg');
    motionsensorSnapShot.setBuffer(() => {
      const createMotionsensorSnapshot = async () => {
        try {
          var data = {
            source: 'motionsensor',
            history: '1'
          }
          const image = await util.retrieveHistorySnapshot(this.getSetting('address'), this.getSetting('username'), this.getSetting('password'), data)
          if (image) {
            return image;
          } else {
            throw new Error('Invalid Response');
          }
        } catch(error) {
          this.error(error);
          throw new Error('Invalid Response');
        }
      }
      createMotionsensorSnapshot();
    });

    motionsensorSnapShot.register()
      .then(() => {
        let motionsensorSnapShotToken = new Homey.FlowToken('motionsensor_snapshot', {
          type: 'image',
          title: Homey.__('Latest Motionsensor Snapshot')
        })

        motionsensorSnapShotToken
          .register()
          .then(() => {
            motionsensorSnapShotToken.setValue(motionsensorSnapShot);
          })
          .catch(this.error.bind(this, 'motionsensorSnapShotToken.register'));

      })
      .catch(this.error.bind(this, 'motionsensorSnapShot.register'));
  }

}

module.exports = DoorbirdDevice;
