'use strict';

const Util = require('/lib/util.js');

module.exports = {
  async testEmail({homey, body}) {
    const util = new Util({homey: homey});
    const result = await util.testEmail(body);
    return result;
  },
  async eventTrigger({homey, params}) {
    const util = new Util({homey: homey});
    const doorbird = homey.drivers.getDriver("doorbird").getDevice({"id": params.mac});
    const result = await doorbird.processEventTrigger(params.event, params.relay);
    return result;
  }
}
