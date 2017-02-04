var request = require('request');
var fs = require('fs');
var nodemailer = require('nodemailer');

exports.getHomeyIp = function (callback) {
    Homey.manager('cloud').getLocalAddress((error, localAddress) => {
        callback(localAddress)
    })
}

exports.updateNotifications = function (callback, homeyaddress, relaxationdb, relaxationms) {
    var doorbirds = Homey.manager('drivers').getDriver('doorbird').getDoorbirds();

    Object.keys(doorbirds).forEach(function(key) {
        var mac     = doorbirds[key].settings.id;
        var address = doorbirds[key].settings.address;
        var user    = doorbirds[key].settings.username;
        var pass    = doorbirds[key].settings.password;

        var doorbellurl = "http://"+ homeyaddress +"/api/app/com.doorbird/doorbell/" + mac + "/";

        var optionsdoorbell = {
            url: "http://"+ address +"/bha-api/notification.cgi?url="+ doorbellurl +"&user=&password=&event=doorbell&subscribe=1&relaxation="+ relaxationdb +"",
            auth: {
                username: user,
                password: pass
            },
            timeout: 1000
        };

        request(optionsdoorbell, function (error, response, body) {
            if (error) {
                callback(err, false);
            }
        });

        var motionurl = "http://"+ homeyaddress +"/api/app/com.doorbird/motionsensor/" + mac + "/";

        var optionsmotion = {
            url: "http://"+ address +"/bha-api/notification.cgi?url="+ motionurl +"&user=&password=&event=motionsensor&subscribe=1&relaxation="+ relaxationms +"",
            auth: {
                username: user,
                password: pass
            },
            timeout: 1000
        };

        request(optionsmotion, function (error, response, body) {
            if (error) {
                callback(error, false);
            }
        });

        callback(false, "Notifications have been set ...");

    });
}

exports.testEmail = function (callback, args) {

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
        subject: 'Test DoorBird Snapshot',
        text: __('This is a test email which confirms your email settings in the Homey DoorBird App are correct.'),
        html: __('<h1>DoorBird Homey App</h1><p>This is a test email which confirms your email settings in the Homey DoorBird App are correct.</p>')
    }

    transporter.sendMail( mailOptions, function( error, info ) {
        if(error) {
            callback ( error, false );
        }
        callback ( false, info.response );
    });
}

exports.createSnapshot = function (device_data, callback) {
    var address = device_data.address;
    var user    = device_data.username;
    var pass    = device_data.password;

    var options = {
        url: "http://"+ address +"/bha-api/image.cgi",
        encoding: 'binary',
        auth: {
            username: user,
            password: pass
        },
        timeout: 2000
    };

    request(options, function (error, response, body) {
        if (error) {
            callback( error, false );
        } else if (response.statusCode == 200) {
            fs.writeFile("/userdata/snapshot.jpg", body, 'binary', function(err) {
                if(err) {
                    callback( err, false );
                } else {
                    fs.readFile('/userdata/snapshot.jpg', function(err, buf) {
                        callback(false, buf.toString('base64'));
                    });
                }
            });
        } else {
            callback( response.statusCode, false );
        }
    });
}

exports.createEmailSnapshot = function (args) {
    return new Promise(function (resolve, reject) {

        var address = args.device.address;
        var user    = args.device.username;
        var pass    = args.device.password;

        var options = {
            url: "http://"+ address +"/bha-api/image.cgi",
            encoding: 'binary',
            auth: {
                username: user,
                password: pass
            },
            timeout: 2000
        };

        request(options, function (error, response, body) {
            if (error) {
                return reject(error);
            } else if (response.statusCode == 200) {
                fs.writeFile("/userdata/snapshot.jpg", body, 'binary', function(err) {
                    if(err) {
                        return reject(err);
                    } else {
                        fs.readFile('/userdata/snapshot.jpg', function(err, buf) {
                            return resolve(buf.toString('base64'));
                        });
                    }
                });
            }
        });
    })
}

exports.sendEmail = function (data, args) {
    return new Promise(function (resolve, reject) {

        var now = getDateTime();
        cid = ""+ now.year + now.month + now.day +"-"+ now.hour + now.min +"";

        var transporter = nodemailer.createTransport({
            host: Homey.manager('settings').get('email_hostname'),
            port: Homey.manager('settings').get('email_port'),
            secure: Homey.manager('settings').get('email_secure'),
            auth: {
                user: Homey.manager('settings').get('email_username'),
                pass: Homey.manager('settings').get('email_password')
            },
            tls: {rejectUnauthorized: false}
        });

        var mailOptions = {
            from: 'DoorBird Homey App <' + Homey.manager('settings').get('email_sender') + '>',
            to: args.mailto,
            subject: 'DoorBird Snapshot - '+ now.year +'-'+ now.month +'-'+ now.day +' '+ now.hour +':'+ now.min,
            text: '',
            html: __('<h1>DoorBird Homey App</h1><p>This snapshot was taken at ') + now.year +'-'+ now.month +'-'+ now.day +' '+ now.hour +':'+ now.min +'.</p><p><img src="cid:'+ cid +'" alt="DoorBird Snapshot" border="0" /></p>',
            attachments: [ {
                filename: 'doorbird_snapshot.jpg',
                content: new Buffer(data, 'base64'),
                cid: cid
            } ]
        }

        transporter.sendMail( mailOptions, function( error, info ) {
            if(error) {
                return reject(error);
            }
            return resolve()
        });
    })
}

exports.light = function (callback, args) {
    var address     = args.device.address;
    var user        = args.device.username;
    var pass        = args.device.password;

    var options = {
        url: "http://"+ address +"/bha-api/light-on.cgi",
        auth: {
            username: user,
            password: pass
        },
        timeout: 1000
    };

    request(options, function (error, response, body) {
        if (error) {
            callback( error, false );
        } else if ( response.statusCode == 200 ) {
            callback( response.statusCode, true );
        }
    });
}

exports.door = function (callback, args) {
    var address     = args.device.address;
    var user        = args.device.username;
    var pass        = args.device.password;

    var options = {
        url: "http://"+ address +"/bha-api/open-door.cgi",
        auth: {
            username: user,
            password: pass
        },
        timeout: 1000
    };

    request(options, function (error, response, body) {
        if (error) {
            callback( error, false );
        } else if ( response.statusCode == 200 ) {
            callback( response.statusCode, true );
        }
    });
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
