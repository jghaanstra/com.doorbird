"use strict";

const Homey = require('homey');
const rp = require('request-promise-native');
const util = require('/lib/util.js');

class DoorbirdDriver extends Homey.Driver {

    onPair(socket) {
        socket.on('disconnect', function() {
            Homey.log ("User aborted pairing, or pairing is finished");
        });

        socket.on('testConnection', function(data, callback) {
            var address = data.address;
            var user    = data.username;
            var pass    = data.password;

            var options = {
                url: "http://"+ address +"/bha-api/info.cgi",
                auth: {
                    username: user,
                    password: pass
                },
                timeout: 1000
            };

            var code = 504;
            rp(options)
                .then(function (response, body) {
                    var code = response.statusCode;
                    if(code == 200) {
                        var info = JSON.parse(body);
                        util.createSnapshot(data)
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
