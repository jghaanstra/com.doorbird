'use strict';

const Homey = require('homey');
const util = require('/lib/util.js');

class DoorbirdDevice extends Homey.Device {

    onInit() {

        new Homey.FlowCardTriggerDevice('doorbell').register();
        new Homey.FlowCardTriggerDevice('motionsensor').register();
        new Homey.FlowCardTriggerDevice('dooropen').register();

        this.registerCapabilityListener('alarm_generic', this.onCapabilityAlarmGeneric.bind(this));
        this.registerCapabilityListener('alarm_motion', this.onCapabilityAlarmMotion.bind(this));
    }

    onCapabilityAlarmGeneric() {
        //TODO: do something when then doorbell is rang
        console.log('doorbell alarm is on');
    }

    onCapabilityAlarmMotion() {
        //TODO: do something when then doorbell is rang
        console.log('motion alarm is on');
    }
}

module.exports = DoorbirdDevice;
