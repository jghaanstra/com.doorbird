"use strict";

const Homey = require('homey');
const flowActions = require("/lib/flow/actions.js");

class DoorbirdApp extends Homey.App {
  onInit() {
    this.log('Initializing DoorBird app ...');
    flowActions.init();
  }
}

module.exports = DoorbirdApp;
