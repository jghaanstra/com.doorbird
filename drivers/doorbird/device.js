'use strict';

const Homey = require('homey');
const util = require('/lib/util.js');

class DoorbirdDevice extends Homey.Device {

    onInit() {
        new Homey.FlowCardTriggerDevice('doorbell').register();
        new Homey.FlowCardTriggerDevice('motionsensor').register();
        new Homey.FlowCardTriggerDevice('dooropen').register();
    }

}

module.exports = DoorbirdDevice;
