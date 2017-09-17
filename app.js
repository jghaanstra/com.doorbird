"use strict";

const Homey = require('homey');
const fs = require('fs');
const util = require("/lib/util.js");
const flowActions = require("/lib/flow/actions.js");

class DoorbirdApp extends Homey.App {

    onInit() {
        this.log('Initializing DoorBird app ...');
        flowActions.init();

        let snapShot = new Homey.Image('jpg');
        snapShot.setPath('/userdata/doorbird.jpg');
        snapShot.register()
            .then(() => {
                let snapShotToken = new Homey.FlowToken('doorbird_snapshot', {
                    type: 'image',
                    title: 'Doorbird Snapshot'
                })

                snapShotToken
                    .register()
                    .then(() => {
                        snapShotToken.setValue(snapShot)
                            .then(this.log.bind(this, 'snapShotToken.setValue'))
                            .catch(this.error.bind(this, 'snapShotToken.setValue'))
                    })
                    .catch(this.error.bind(this, 'snapShotToken.register'));

                new Homey.FlowCardAction('doorbird_snapshot_action')
                    .register()
                    .registerRunListener((args, state) => {
                        const createSnapshot = async () => {
                            const image = await util.createSnapshot(args.device.getSetting('address'), args.device.getSetting('username'), args.device.getSetting('password'))
                            if (image) {
                                fs.writeFile("/userdata/doorbird.jpg", image, 'base64', function(error) {
                                    if(error) {
                                        throw new Error('Snapshot not created succesfully');
                                    } else {
                                        return Promise.resolve(true);
                                    }
                                });
                            } else {
                                throw new Error('Snapshot not created succesfully');
                            }
                        }
                        createSnapshot();

                        return Promise.resolve(true);
                    })

                new Homey.FlowCardTrigger('doorbird_snapshot_trigger')
                    .register()
                    .trigger({image_snapshot: snapShot})
                    .then(this.log.bind( this, 'doorbirdSnapshotTrigger.trigger'))
                    .catch(this.error.bind( this, 'doorbirdSnapshotTrigger.trigger'));
            })
            .catch(this.error.bind(this, 'snapShot.register'));

    }
}

module.exports = DoorbirdApp;
