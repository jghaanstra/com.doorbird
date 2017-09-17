"use strict";

const Homey = require('homey');
const rp = require('request-promise-native');
const util = require('/lib/util.js');

class DoorbirdDriver extends Homey.Driver {

    onPair(socket) {
        socket.on('testConnection', function(data, callback) {
            var address  = data.address;
            var username = data.username;
            var password = data.password;

            var options = {
                url: "http://"+ address +"/bha-api/info.cgi",
                auth: {
                    user: username,
                    pass: password
                },
                resolveWithFullResponse: true,
                timeout: 2000
            };

            var code = 504;
            rp(options)
                .then(function (response) {
                    var code = response.statusCode;
                    if(code == 200) {
                        var info = JSON.parse(response.body);
                        util.createSnapshot(address, username, password)
                            .then(image => {
                                callback( false, { image: image, info: info.BHA.VERSION[0] } );
                            })
                            .catch(error => {
                                callback(error, false);
                            })
                    } else {
                        callback(code, false);
                    }
                })
                .catch(function (error) {
                    callback(error, false);
                });
        });
    }

}

module.exports = DoorbirdDriver;
