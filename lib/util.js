const Homey = require('homey');
const fetch = require('node-fetch');
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

exports.updateNotifications = function (homeyaddress, callback) {
  const doorbirds = Homey.ManagerDrivers.getDriver('doorbird').getDevices();

  if (doorbirds.length > 0) {
    Object.keys(doorbirds).forEach(function(key) {
      var mac      = doorbirds[key].getData().id;
      var address  = doorbirds[key].getSetting('address');
      var username = doorbirds[key].getSetting('username');
      var password = doorbirds[key].getSetting('password');

      var doorbellurl = "http://"+ homeyaddress +"/api/app/com.doorbird/doorbell/" + mac + "/";
      var motionurl   = "http://"+ homeyaddress +"/api/app/com.doorbird/motionsensor/" + mac + "/";
      var dooropenurl = "http://"+ homeyaddress +"/api/app/com.doorbird/relays/" + mac + "/";

      exports.sendCommand('/bha-api/info.cgi', address, username, password)
        .then(data => {
          var relays = data.BHA.VERSION[0].RELAYS;

          fetch('http://'+ address +'/bha-api/favorites.cgi?action=save&type=http&title=Homey%20Doorbell%20Trigger&value='+ doorbellurl +'&id=1000', {
              method: 'GET',
              headers: {'Authorization': 'Basic ' + Buffer.from(username + ":" + password).toString('base64')},
              timeout: 2000
            })
            .then(checkStatus)
            .then(res => res.text())
            .then(body => {

              fetch('http://'+ address +'/bha-api/favorites.cgi?action=save&type=http&title=Homey%20Motion%20Trigger&value='+ motionurl +'&id=1001', {
                  method: 'GET',
                  headers: {'Authorization': 'Basic ' + Buffer.from(username + ":" + password).toString('base64')},
                  timeout: 2000
                })
                .then(checkStatus)
                .then(res => res.text())
                .then(body => {

                  var number = 1001;
                  relays.forEach(function(relay) {
                    number++;
                    fetch('http://'+ address +'/bha-api/favorites.cgi?action=save&type=http&title=Homey%20Relay%20Trigger%20'+ relay +'&value='+ dooropenurl + relay +'/&id='+ number, {
                        method: 'GET',
                        headers: {'Authorization': 'Basic ' + Buffer.from(username + ":" + password).toString('base64')},
                        timeout: 2000
                      })
                      .then(checkStatus)
                      .then(res => res.text())
                      .then(body => {
                        callback(false, "Notifications have been set ...");
                      })
                      .catch(err => {
                        callback(err, false);
                      });
                  });

                })
                .catch(err => {
                  callback(err, false);
                });

            })
            .catch(err => {
              callback(err, false);
            });
      })
    });
  } else {
    callback('No DoorBirds have been added as device to Homey', false);
  }
}

exports.getBufferSnapshot = function (url, username, password) {
  return new Promise(function (resolve, reject) {
    fetch(url, {
        method: 'GET',
        headers: {'Authorization': 'Basic ' + Buffer.from(username + ":" + password).toString('base64')},
        timeout: 10000
      })
      .then(checkStatus)
      .then(res => res.buffer())
      .then(buffer => {
        return resolve(buffer);
      })
      .catch(err => {
        return reject(err);
      });
  })
}

exports.getStreamSnapshot = function (url, username, password) {
  return new Promise(function (resolve, reject) {
    fetch(url, {
        method: 'GET',
        headers: {'Authorization': 'Basic ' + Buffer.from(username + ":" + password).toString('base64')},
        timeout: 10000
      })
      .then(checkStatus)
      .then(res => {
        return resolve(res);
      })
      .catch(err => {
        return reject(err);
      });
  })
}

exports.sendCommand = function (endpoint, address, username, password) {
  return new Promise(function (resolve, reject) {
    fetch('http://'+ address + endpoint, {
        method: 'GET',
        headers: {'Authorization': 'Basic ' + Buffer.from(username + ":" + password).toString('base64')},
        timeout: 2000
      })
      .then(checkStatus)
      .then(res => res.json())
      .then(json => {
        return resolve(json);
      })
      .catch(err => {
        return reject(err);
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
    from: 'Homey DoorBird App <' + args.body.email_sender + '>',
    to: args.body.email_sender,
    subject: 'Test Email Homey DoorBird App',
    text: Homey.__('This is a test email which confirms your email settings in the Homey DoorBird App are correct.'),
    html: Homey.__('<h1>Homey DoorBird App</h1><p>This is a test email which confirms your email settings in the Homey DoorBird App are correct.</p>')
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
      from: 'Homey DoorBird App <' + Homey.ManagerSettings.get('email_sender') + '>',
      to: args.mailto,
      subject: 'Homey DoorBird App Snapshot - '+ now.year +'-'+ now.month +'-'+ now.day +' '+ now.hour +':'+ now.min,
      text: '',
      html: Homey.__('<h1>Homey DoorBird App</h1><p>This snapshot was taken at ') + now.year +'-'+ now.month +'-'+ now.day +' '+ now.hour +':'+ now.min +'.</p><p><img src="cid:'+ cid +'" alt="DoorBird Snapshot" border="0" /></p>',
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
        content: image,
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

exports.getRelays = function (address, username, password) {
  return new Promise(function (resolve, reject) {
    fetch('http://'+ address + '/bha-api/info.cgi', {
        method: 'GET',
        headers: {'Authorization': 'Basic ' + Buffer.from(username + ":" + password).toString('base64')},
        timeout: 2000
      })
      .then(checkStatus)
      .then(res => res.json())
      .then(json => {
        var relays = json.BHA.VERSION[0].RELAYS
        var list = [];
        relays.forEach(function(relay) {
          list.push({
            icon: '/app/com.doorbird/assets/icon.svg',
            name: 'Relay '+ relay,
            id: relay
          })
        });
        return resolve(list);
      })
      .catch(err => {
        return reject(err);
      });
  })
}

exports.ask_door = function (args) {
  return new Promise(function (resolve, reject) {
    try {
      Homey.ManagerSpeechInput.confirm(Homey.__('Do you want me to open the door?'), {}, function(error, confirmed) {
        if (error) {
          Homey.ManagerSpeechOutput.say(Homey.__('I did not understand you correctly, please try again'));
          return reject(error);
        } else if (confirmed) {
          exports.sendCommand('/bha-api/open-door.cgi', args.device.getSetting('address'), args.device.getSetting('username'), args.device.getSetting('password'))
            .then(result => {
              Homey.ManagerSpeechOutput.say(Homey.__('OK, the door relay has been triggered'));
              return resolve();
            })
            .catch(error => {
              Homey.ManagerSpeechOutput.say(Homey.__('Something went wrong') + ' ' + error);
              return reject(error);
            })
          return resolve();
        } else if (!confirmed) {
          Homey.ManagerSpeechOutput.say(Homey.__('No action has been taken'));
          return reject(Homey.__('No action has been taken'));
        } else {
          return reject(Homey.__('Inconclusive response'));
        }
      });
    } catch(error) {
      Homey.ManagerSpeechOutput.say(Homey.__('Something went wrong') + ' ' + error);
      return reject(error);
    }
  })
}

function checkStatus(res) {
  if (res.ok) { // res.status >= 200 && res.status < 300
    return res;
  } else {
    throw new Error(res.status);
  }
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
