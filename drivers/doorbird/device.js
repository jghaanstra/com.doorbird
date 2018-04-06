'use strict';

const Homey = require('homey');
const _sodium = require('libsodium-wrappers');
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
        doorbirdSnapShot.setBuffer((args, callback) => {
            const createSnapshot = async () => {
                const image = await util.createSnapshot(this.getSetting('address'), this.getSetting('username'), this.getSetting('password'))
                if (image) {
                    callback(null,image);
                } else {
                    callback(false,null);
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
        doorbellSnapShot.setBuffer((args, callback) => {
            var data = {
                source: 'doorbell',
                history: '1'
            }
            const createDoorbellSnapshot = async () => {
                const image = await util.retrieveHistorySnapshot(this.getSetting('address'), this.getSetting('username'), this.getSetting('password'), data)
                if (image) {
                    callback(null,image);
                } else {
                    callback(false,null);
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
        motionsensorSnapShot.setBuffer((args, callback) => {
            var data = {
                source: 'motionsensor',
                history: '1'
            }
            const createMotionsensorSnapshot = async () => {
                const image = await util.retrieveHistorySnapshot(this.getSetting('address'), this.getSetting('username'), this.getSetting('password'), data)
                if (image) {
                    callback(null,image);
                } else {
                    callback(false,null);
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

    // HELPER FUNCTIONS
    handleBroadcastEvent(message) {
        if (message.length > 25) {
            (async() => {
                const IDENT       = message.slice(0, 3);
                const VERSION     = message.slice(3, 4);
                const OPSLIMIT    = message.slice(4, 8);
                const MEMLIMIT    = message.slice(8, 12);
                const SALT        = message.slice(12, 28);
                const NONCE       = message.slice(28, 36);
                const CIPHERTEXT  = message.slice(36);

                await _sodium.ready;
                const sodium = _sodium;

                function stretch(password, salt) {
                    let hash = sodium.crypto_pwhash(32, password.substr(0, 5), salt, 4, 8192, sodium.crypto_pwhash_ALG_ARGON2I13);
                    return Buffer.from(hash);
                };

                function decrypt(ciphertext, nonce, key) {
                    try {
                        let dec = sodium.crypto_aead_chacha20poly1305_decrypt(null, ciphertext, null, nonce, key);
                        return Buffer.from(dec);
                    } catch (error) {
                        return null;
                    }
                };

                let key = await stretch(PASSWORD, SALT);
                let dec = await decrypt(CIPHERTEXT, NONCE, key);

                if (dec) {
                    const intercomid = dec.slice(0, 6).toString('utf-8');
                    const dbevent = dec.slice(6, 14).toString('utf-8');
                    const timestamp = dec.slice(14).readInt32BE(0);

                    console.log(intercomid);
                    console.log(dbevent);
                    console.log(timestamp);

                    // match UDP packet with registered DoorBirds
                    if (this.getStoreValue('intercomid') === intercomid) {
                        // if event is doorbell rang
                        if (dbevent.startsWith("1")) {
                            // check if alarm is not already tiggered since multiple UDP events are send
                            if(!this.getCapabilityValue('alarm_generic')) {
                                // create snapshot and trigger card
                                const snapShot = async () => {
                                    try {
                                        const image = await util.createSnapshot(this.getSetting('address'), this.getSetting('username'), this.getSetting('password'))
                                        if (image) {
                                            var snapshot = image.toString('base64');
                                            Homey.ManagerFlow.getCard('trigger', 'doorbell').trigger(this, {snapshot: snapshot}, {})
                                                .then(result => {
                                                    callback(null, 'OK');
                                                })
                                                .catch(error => {
                                                    callback(error, false);
                                                })
                                        }
                                    } catch (error) {
                                        this.log(error);
                                    }
                                }
                                snapShot();
                            }
                        }
                    }
                }
            })();
        }
    }
}

module.exports = DoorbirdDevice;
