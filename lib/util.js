const Homey = require('homey');
const rp = require('request-promise-native');
const nodemailer = require('nodemailer');

exports.getHomeyIp = function () {
    return new Promise(function (resolve, reject) {
        Homey.ManagerCloud.getLocalAddress()
            .then(localAddress => {
                return resolve(localAddress)
            })
            .catch(error => {
                throw new Error(error);
            })
    })
}

exports.updateNotifications = function (homeyaddress, relaxationdb, relaxationdbenable, relaxationms, relaxationmsenable, relaxationdo, relaxationdoenable, callback) {
    const doorbirds = Homey.ManagerDrivers.getDriver('doorbird').getDevices();

    Object.keys(doorbirds).forEach(function(key) {
        var mac      = doorbirds[key].getSetting('id');
        var address  = doorbirds[key].getSetting('address');
        var username = doorbirds[key].getSetting('username');
        var password = doorbirds[key].getSetting('password');

        var doorbellurl = "http://"+ homeyaddress +"/api/app/com.doorbird/doorbell/" + mac + "/";
        var motionurl = "http://"+ homeyaddress +"/api/app/com.doorbird/motionsensor/" + mac + "/";
        var dooropenurl = "http://"+ homeyaddress +"/api/app/com.doorbird/dooropen/" + mac + "/";

        var optionsdoorbell = {
            url: "http://"+ address +"/bha-api/notification.cgi?url="+ doorbellurl +"&user=&password=&event=doorbell&subscribe="+ relaxationdbenable +"&relaxation="+ relaxationdb +"",
            auth: {
                user: username,
                pass: password
            },
            timeout: 2000
        };

        rp(optionsdoorbell)
            .catch(function (error) {
                callback(error, false);
            });

        var optionsmotion = {
            url: "http://"+ address +"/bha-api/notification.cgi?url="+ motionurl +"&user=&password=&event=motionsensor&subscribe="+ relaxationmsenable +"&relaxation="+ relaxationms +"",
            auth: {
                user: username,
                pass: password
            },
            timeout: 2000
        };

        rp(optionsmotion)
            .catch(function (error) {
                callback(error, false);
            });

        var optionsdooropen = {
            url: "http://"+ address +"/bha-api/notification.cgi?url="+ dooropenurl +"&user=&password=&event=dooropen&subscribe="+ relaxationdoenable +"&relaxation="+ relaxationdo +"",
            auth: {
                user: username,
                pass: password
            },
            timeout: 2000
        };

        rp(optionsdooropen)
            .catch(function (error) {
                callback(error, false);
            });

        callback(false, "Notifications have been set ...");

    });
}

exports.createSnapshot = function (address, username, password) {
    return new Promise(function (resolve, reject) {
        var options = {
            url: "http://"+ address +"/bha-api/image.cgi",
            encoding: 'binary',
            auth: {
                user: username,
                pass: password
            },
            resolveWithFullResponse: true,
            timeout: 10000
        };

        rp(options)
            .then(function (response) {
                if (response.statusCode == 200) {
                    var buf = new Buffer(response.body, 'binary');
                    return resolve(buf.toString('base64'));
                } else {
                    return reject(response.statusCode);
                }
            })
            .catch(function (error) {
                return reject(error);
            });
    })
}

exports.retrieveHistorySnapshot = function (address, username, password, args) {
    return new Promise(function (resolve, reject) {
        var options = {
            url: "http://"+ address +"/bha-api/history.cgi?event="+ args.source +"&index="+ args.history +"",
            encoding: 'binary',
            auth: {
                user: username,
                pass: password
            },
            resolveWithFullResponse: true,
            timeout: 10000
        };

        rp(options)
            .then(function (response) {
                if (response.statusCode == 200) {
                    var buf = new Buffer(response.body, 'binary');
                    return resolve(buf.toString('base64'));
                } else {
                    return reject(response.statusCode);
                }
            })
            .catch(function (error) {
                return reject(error);
            });
    })
}

exports.testEmail = function (args, callback) {
    var transporter = nodemailer.createTransport({
        host: args.body.email_hostname,
        port: args.body.email_port,
        secure: args.body.email_secure,
        auth: {
            user: args.body.email_username,
            pass: args.body.email_password
        },
        tls: {rejectUnauthorized: false}
    });

    var mailOptions = {
        from: 'DoorBird Homey App <' + args.body.email_sender + '>',
        to: args.body.email_sender,
        subject: 'Test Email DoorBird App',
        text: Homey.__('This is a test email which confirms your email settings in the Homey DoorBird App are correct.'),
        html: Homey.__('<h1>DoorBird Homey App</h1><p>This is a test email which confirms your email settings in the Homey DoorBird App are correct.</p>')
    }

    transporter.sendMail(mailOptions, function(error, info) {
        if(error) {
            callback (error, false);
        }
        callback (false, "OK");
    });
}

exports.sendSnapshot = function (image, args) {
    return new Promise(function (resolve, reject) {
        var now = getDateTime();
        var cid = ""+ now.year + now.month + now.day +"-"+ now.hour + now.min +"";

        var transporter = nodemailer.createTransport({
            host: Homey.ManagerSettings.get('email_hostname'),
            port: Homey.ManagerSettings.get('email_port'),
            secure: Homey.ManagerSettings.get('email_secure'),
            auth: {
                user: Homey.ManagerSettings.get('email_username'),
                pass: Homey.ManagerSettings.get('email_password')
            },
            tls: {rejectUnauthorized: false}
        });

        var mailOptions = {
            from: 'DoorBird Homey App <' + Homey.ManagerSettings.get('email_sender') + '>',
            to: args.mailto,
            subject: 'DoorBird Snapshot - '+ now.year +'-'+ now.month +'-'+ now.day +' '+ now.hour +':'+ now.min,
            text: '',
            html: Homey.__('<h1>DoorBird Homey App</h1><p>This snapshot was taken at ') + now.year +'-'+ now.month +'-'+ now.day +' '+ now.hour +':'+ now.min +'.</p><p><img src="cid:'+ cid +'" alt="DoorBird Snapshot" border="0" /></p>',
            attachments: [ {
                filename: 'doorbird_snapshot.jpg',
                content: new Buffer(image, 'base64'),
                cid: cid
            } ]
        }

        transporter.sendMail(mailOptions, function(error, info) {
            if(error) {
                return reject(error);
            } else {
                return resolve();
            }
        });
    })
}

exports.sendHistorySnapshot = function (image, args) {
    return new Promise(function (resolve, reject) {
        var history = args.history;
        var source  = args.source;
        var now = getDateTime();
        var cid = ""+ now.year + now.month + now.day +"-"+ now.hour + now.min +"";

        console.log('start sending');

        var transporter = nodemailer.createTransport({
            host: Homey.ManagerSettings.get('email_hostname'),
            port: Homey.ManagerSettings.get('email_port'),
            secure: Homey.ManagerSettings.get('email_secure'),
            auth: {
                user: Homey.ManagerSettings.get('email_username'),
                pass: Homey.ManagerSettings.get('email_password')
            },
            tls: {rejectUnauthorized: false}
        });

        var mailOptions = {
            from: 'DoorBird Homey App <' + Homey.ManagerSettings.get('email_sender') + '>',
            to: args.mailto,
            subject: 'DoorBird History Snapshot',
            text: '',
            html: Homey.__('<h1>DoorBird Homey App - History Snapshot</h1><p>This is history snapshot') + ` ${source} #${history}.</p>`,
            attachments: [ {
                filename: 'doorbird_history_snapshot.jpg',
                content: new Buffer(image, 'base64'),
                cid: cid
            } ]
        }

        transporter.sendMail(mailOptions, function(error, info) {
            if(error) {
                return reject(error);
            } else {
                return resolve();
            }
        });
    })
}

exports.light = function (args) {
    return new Promise(function (resolve, reject) {
        var options = {
            url: "http://"+ args.device.getSetting('address') +"/bha-api/light-on.cgi",
            auth: {
                user: args.device.getSetting('username'),
                pass: args.device.getSetting('password')
            },
            timeout: 2000
        };

        rp(options)
            .then(function (response, body) {
                return resolve();
            })
            .catch(function (error) {
                return reject(error.message);
            });
    })
}

exports.door = function (args) {
    return new Promise(function (resolve, reject) {
        var options = {
            url: "http://"+ args.device.getSetting('address') +"/bha-api/open-door.cgi",
            auth: {
                user: args.device.getSetting('username'),
                pass: args.device.getSetting('password')
            },
            timeout: 2000
        };

        rp(options)
            .then(function (response, body) {
                return resolve();
            })
            .catch(function (error) {
                return reject(error.message);
            });
    })
}

exports.ask_door = function (args) {
    return new Promise(function (resolve, reject) {
        Homey.ManagerSpeechInput.confirm(Homey.__('Do you want me to open the door?'), function(error, confirmed) {
            if (error) {
                console.log('error');
                Homey.ManagerSpeechOutput.say(Homey.__('I did not understand you correctly, please try again'));
                return reject(error);
            } else if (confirmed) {
                console.log('confirmed');
                exports.door(args)
                    .then(result => {
                        Homey.ManagerSpeechOutput.say(Homey.__('OK, the door relay has been triggered'));
                        return resolve();
                    })
                    .catch(error => {
                        Homey.ManagerSpeechOutput.say(Homey.__('Something went wrong') + ' ' + error);
                        return reject(error);
                    })
            } else if (!confirmed) {
                console.log('not confirmed');
                Homey.ManagerSpeechOutput.say(Homey.__('No action has been taken'));
                return reject(Homey.__('No action has been taken'));
            } else {
                console.log('inconclusive');
                return reject(Homey.__('Inconclusive response'));
            }
            return reject(Homey.__('Inconclusive response'));
        });
    })
}

function getDateTime() {
    var date = new Date();

    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    var year = date.getFullYear();

    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return { year: year, month: month, day: day, hour: hour, min: min };
}
