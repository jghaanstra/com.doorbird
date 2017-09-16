'use strict';

const Homey = require('homey');
const util = require('/lib/util.js');

class DoorbirdDevice extends Homey.Device {

    onInit() {

        new Homey.FlowCardTriggerDevice('doorbell').register();
        new Homey.FlowCardTriggerDevice('motionsensor').register();
        new Homey.FlowCardTriggerDevice('dooropen').register();

        new Homey.FlowCardAction('light')
            .register()
            .registerRunListener((args) => { return Promise.resolve(util.light(args)) });

        new Homey.FlowCardAction('door')
            .register()
            .registerRunListener((args) => { return Promise.resolve(util.door(args)) });

        new Homey.FlowCardAction('ask_door')
            .register()
            .registerRunListener((args) => { return Promise.resolve(util.ask_door(args)) });


        this.registerCapabilityListener('alarm_generic', this.onCapabilityAlarmGeneric.bind(this));
        this.registerCapabilityListener('alarm_motion', this.onCapabilityAlarmMotion.bind(this));
    }

    onCapabilityAlarmGeneric() {
        //TODO: do something when then doorbell is rang

    }

    onCapabilityAlarmMotion() {
        //TODO: do something when then doorbell is rang

    }
}

module.exports = DoorbirdDevice;
