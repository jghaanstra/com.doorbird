"use strict";

var flowActions = require("../../lib/flow/actions.js")

var self = module.exports = {
    init: function () {
        Homey.log("Initializing DoorBird app ...");

        flowActions.init();
    }
}
