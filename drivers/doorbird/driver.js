"use strict";

const Homey = require('homey');
const util = require('/lib/util.js');

class DoorbirdDriver extends Homey.Driver {

  onPair(socket) {
    socket.on('testConnection', function(data, callback) {
      return new Promise(function (resolve, reject) {
        util.sendCommand('/bha-api/info.cgi', data.address, data.username, data.password)
          .then(body => {
            util.getBufferSnapshot('http://'+ data.address +'/bha-api/image.cgi', data.username, data.password)
              .then(image => {
                callback(false, { image: image.toString('base64'), info: body.BHA.VERSION[0] });
              })
              .catch(err => {
                callback(err, false);
              })
          })
          .catch(err => {
            callback(err, false);
          });
      })
    });
  }

}

module.exports = DoorbirdDriver;
