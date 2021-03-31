'use strict';

const fetch = require('node-fetch');
const nodemailer = require('nodemailer');

class Util {

  constructor(opts) {
    this.homey = opts.homey;
  }

  getHomeyIp() {
    return new Promise(async (resolve, reject) => {
      try {
        let localAddress = await this.homey.cloud.getLocalAddress();
        return resolve(localAddress);
      } catch (error) {
        return reject(error);
      }
    })
  }

  sendCommand(endpoint, address, username, password, timeout = 2000) {
    return new Promise((resolve, reject) => {
      fetch('http://'+ address + endpoint, {
          method: 'GET',
          headers: {'Authorization': 'Basic ' + Buffer.from(username + ":" + password).toString('base64')},
          timeout: timeout
        })
        .then(this.checkStatus)
        .then(res => res.json())
        .then(json => {
          return resolve(json);
        })
        .catch(error => {
          return reject(error);
        });
    })
  }

  sendCommandNotification(endpoint, address, username, password) {
    return new Promise((resolve, reject) => {
      fetch('http://'+ address + endpoint, {
          method: 'GET',
          headers: {'Authorization': 'Basic ' + Buffer.from(username + ":" + password).toString('base64')},
          timeout: 2000
        })
        .then(this.checkStatus)
        .then(res => {
          return resolve(res);
        })
        .catch(error => {
          return reject(error);
        });
    })
  }

  postCommand(endpoint, address, username, password, payload) {
    return new Promise((resolve, reject) => {
      fetch('http://'+ address + endpoint, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(username + ":" + password).toString('base64'),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          timeout: 10000
        })
        .then(this.checkStatus)
        .then(res => {
          return resolve(res);
        })
        .catch(error => {
          return reject(error);
        });
    })
  }

  updateNotifications(address, username, password, mac, action) {
    return new Promise(async (resolve, reject) => {
      try {
        var homeyaddress = await this.getHomeyIp();
        var info = await this.sendCommand('/bha-api/info.cgi', address, username, password);
        var relays = info.BHA.VERSION[0].RELAYS;
        var number_http = 1001;
        var number_schedule = 1001;

        if (action == 'remove') {
          let favorites = await this.sendCommand('/bha-api/favorites.cgi', address, username, password);

          for(const [id, values] of Object.entries(favorites.http)) {
            if (values.title.includes('Homey')) {
              let endpoint = '/bha-api/favorites.cgi?action=remove&type=http&id='+ id;
              let result = await this.sendCommandNotification(endpoint, address, username, password);
            }
          }
        } else if (action == 'add') {

          /* add http callbacks */
          let doorbellurl = '/bha-api/favorites.cgi?action=save&type=http&title=Homey%20Doorbell%20Trigger&value=http://'+ homeyaddress +'/api/app/com.doorbird/event/doorbell/' + mac + '/0&id=1000';
          let motionurl = '/bha-api/favorites.cgi?action=save&type=http&title=Homey%20Motion%20Trigger&value=http://'+ homeyaddress +'/api/app/com.doorbird/event/motionsensor/' + mac + '/0&id=1001';

          let doorbellresult = await this.sendCommandNotification(doorbellurl, address, username, password);
          let motionresult = await this.sendCommandNotification(motionurl, address, username, password);

          relays.forEach(async (relay) => {
            number_http++;
            let endpoint = '/bha-api/favorites.cgi?action=save&type=http&title=Homey%20Relay%20'+ relay +'%20Trigger&value=http://'+ homeyaddress +'/api/app/com.doorbird/event/relays/' + mac + '/'+ relay +'&id='+ number_http;
            let motionresult = await this.sendCommandNotification(endpoint, address, username, password);
          });

          /* schedule http callbacks */
          let schedule = await this.sendCommand('/bha-api/schedule.cgi', address, username, password);

          let doorbell_schedule = schedule.find(obj => { return obj.input === 'doorbell' });
          let motion_schedule = schedule.find(obj => { return obj.input === 'motion' });
          let relay_schedule = schedule.filter(relay => relay.input.includes('relay'));

          if (doorbell_schedule !== undefined) {
            if (doorbell_schedule.output.some(item => item.event === 'http')) {
              doorbell_schedule.output.filter(e => e.event === 'http').forEach(e => {
                e.param = "1000";
                e.schedule = {"weekdays": [{"from": "82800", "to": "82799"}]}
              });
              let result_doorbell_schedule = await this.postCommand('/bha-api/schedule.cgi', address, username, password, doorbell_schedule);
            } else {
              let http_event = {
                "event": "http",
                "param": "1000",
                "schedule": {"weekdays": [{"from": "82800", "to": "82799"}]}
              }
              doorbell_schedule.output.push(http_event);
              let result_doorbell_schedule = await this.postCommand('/bha-api/schedule.cgi', address, username, password, doorbell_schedule);
            }
          } else {
            let payload = {
              "input": "doorbell",
              "param": "1",
              "output": [
                {
                  "event": "http",
                  "param": "1000",
                  "schedule": {"weekdays": [{"from": "82800", "to": "82799"}]}
                }
              ]
            }
            let result_doorbell_schedule = await this.postCommand('/bha-api/schedule.cgi', address, username, password, payload);
          }

          if (motion_schedule !== undefined) {
            if (motion_schedule.output.some(item => item.event === 'http')) {
              motion_schedule.output.filter(e => e.event === 'http').forEach(e => {
                e.param = "1001";
                e.schedule = {"weekdays": [{"from": "82800", "to": "82799"}]}
              });
              let result_motion_schedule = await this.postCommand('/bha-api/schedule.cgi', address, username, password, motion_schedule);
            } else {
              let http_event = {
                "event": "http",
                "param": "1001",
                "schedule": {"weekdays": [{"from": "82800", "to": "82799"}]}
              }
              motion_schedule.output.push(http_event);
              let result_motion_schedule = await this.postCommand('/bha-api/schedule.cgi', address, username, password, motion_schedule);
            }
          } else {
            let payload = {
              "input": "motion",
              "param": "",
              "output": [
                {
                  "event": "http",
                  "param": "1001",
                  "schedule": {"weekdays": [{"from": "82800", "to": "82799"}]}
                }
              ]
            }
            let result_motion_schedule = await this.postCommand('/bha-api/schedule.cgi', address, username, password, payload);
          }

          if (relay_schedule.length === 0) {
            relays.forEach(async (relay) => {
              number_schedule++;
              let payload = {
                "input": "relay",
                "param": relay,
                "output": [
                  {
                    "event": "http",
                    "param": ""+ number_schedule +"",
                    "schedule": {"weekdays": [{"from": "82800", "to": "82799"}]}
                  }
                ]
              }
              let result_relay_schedule = await this.postCommand('/bha-api/schedule.cgi', address, username, password, payload);
            });
          } else {
            relays.forEach(async (relay) => {
              number_schedule++
              let current_schedule = relay_schedule.filter(item => item.param.includes(relay));
              if (current_schedule.length > 0) {
                if (current_schedule[0].output.some(item => item.event === 'http')) {
                  current_schedule[0].output.filter(e => e.event === 'http').forEach(e => {
                    e.param = ""+ number_schedule +"";
                    e.schedule = {"weekdays": [{"from": "82800", "to": "82799"}]}
                  });
                  let result_relay_schedule = await this.postCommand('/bha-api/schedule.cgi', address, username, password, current_schedule[0]);
                } else {
                  let http_event = {
                    "event": "http",
                    "param": ""+ number_schedule +"",
                    "schedule": {"weekdays": [{"from": "82800", "to": "82799"}]}
                  }
                  current_schedule[0].output.push(http_event);
                  let result_relay_schedule = await this.postCommand('/bha-api/schedule.cgi', address, username, password, current_schedule[0]);
                }
              }
            });
          }

        }
        return resolve(true);
      } catch (error) {
        return reject(error);
      }
    });
  }

  getBufferSnapshot(endpoint, username, password, returntype = 'buffer') {
    return new Promise((resolve, reject) => {
      fetch(endpoint, {
          method: 'GET',
          headers: {'Authorization': 'Basic ' + Buffer.from(username + ":" + password).toString('base64')},
          timeout: 10000
        })
        .then(this.checkStatus)
        .then(res => res.buffer())
        .then(buffer => {
          if (returntype == 'base64') {
            const image = 'data:image/jpeg;base64,' + buffer.toString('base64');
            return resolve(image);
          } else {
            return resolve(buffer);
          }
        })
        .catch(err => {
          return reject(err);
        });
    })
  }

  getStreamSnapshot(endpoint, username, password) {
    return new Promise((resolve, reject) => {
      fetch(endpoint, {
          method: 'GET',
          headers: {'Authorization': 'Basic ' + Buffer.from(username + ":" + password).toString('base64')},
          timeout: 10000
        })
        .then(this.checkStatus)
        .then(res => {
          return resolve(res);
        })
        .catch(err => {
          return reject(err);
        });
    })
  }

  testEmail(args) {
    var transporter = nodemailer.createTransport({
      host: args.email_hostname,
      port: args.email_port,
      secure: args.email_secure,
      auth: {
        user: args.email_username,
        pass: args.email_password
      },
      tls: {rejectUnauthorized: false}
    });

    var mailOptions = {
      from: 'Homey DoorBird App <' + args.email_sender + '>',
      to: args.email_sender,
      subject: 'Test Email DoorBird App',
      text: this.homey.__('util.test_email_body_text'),
      html: this.homey.__('util.test_email_body_html')
    }

    return transporter.sendMail(mailOptions);
  }

  sendSnapshot(image, args) {
    var now = this.getDateTime();
    var cid = ""+ now.year + now.month + now.day +"-"+ now.hour + now.min +"";

    var transporter = nodemailer.createTransport({
      host: this.homey.settings.get('email_hostname'),
      port: this.homey.settings.get('email_port'),
      secure: this.homey.settings.get('email_secure'),
      auth: {
        user: this.homey.settings.get('email_username'),
        pass: this.homey.settings.get('email_password')
      },
      tls: {rejectUnauthorized: false}
    });

    var mailOptions = {
      from: 'Homey DoorBird App <' + this.homey.settings.get('email_sender') + '>',
      to: args.mailto,
      subject: 'Homey DoorBird App Snapshot - '+ now.year +'-'+ now.month +'-'+ now.day +' '+ now.hour +':'+ now.min,
      text: '',
      html: this.homey.__('util.email_snapshot_html') + now.year +'-'+ now.month +'-'+ now.day +' '+ now.hour +':'+ now.min +'.</p><p><img src="cid:'+ cid +'" alt="DoorBird Snapshot" border="0" /></p>',
      attachments: [ {
        filename: 'doorbird_snapshot.jpg',
        content: image,
        cid: cid
      } ]
    }

    return transporter.sendMail(mailOptions);
  }

  sendHistorySnapshot(image, args) {
    var history = args.history;
    var source  = args.source;
    var now = getDateTime();
    var cid = ""+ now.year + now.month + now.day +"-"+ now.hour + now.min +"";

    var transporter = nodemailer.createTransport({
      host: this.homey.settings.get('email_hostname'),
      port: this.homey.settings.get('email_port'),
      secure: this.homey.settings.get('email_secure'),
      auth: {
        user: this.homey.settings.get('email_username'),
        pass: this.homey.settings.get('email_password')
      },
      tls: {rejectUnauthorized: false}
    });

    var mailOptions = {
      from: 'Homey DoorBird App <' + this.homey.settings.get('email_sender') + '>',
      to: args.mailto,
      subject: 'Homey DoorBird App History Snapshot',
      text: '',
      html: this.this.homey.__('util.email_history_snapshot_html') + `${source} #${history}.</p>`+ '<p><img src="cid:'+ cid +'" alt="DoorBird Snapshot" border="0" /></p>',
      attachments: [ {
        filename: 'doorbird_snapshot.jpg',
        content: image,
        cid: cid
      } ]
    }

    return transporter.sendMail(mailOptions);
  }

  getRelays(address, username, password) {
    return new Promise((resolve, reject) => {
      fetch('http://'+ address + '/bha-api/info.cgi', {
          method: 'GET',
          headers: {'Authorization': 'Basic ' + Buffer.from(username + ":" + password).toString('base64')},
          timeout: 2000
        })
        .then(this.checkStatus)
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

  askDoor(args) {
    return new Promise((resolve, reject) => {
      try {
        this.homey.speechInput.confirm(this.homey.__('util.open_door'), {}, function(error, confirmed) {
          if (error) {
            this.homey.speechOutput.say(this.homey.__('util.not_understand'));
            return reject(error);
          } else if (confirmed) {
            this.sendCommand('/bha-api/open-door.cgi', args.device.getSetting('address'), args.device.getSetting('username'), args.device.getSetting('password'))
              .then(result => {
                this.homey.speechOutput.say(this.homey.__('util.relay_triggered'));
                return resolve();
              })
              .catch(error => {
                this.homey.speechOutput.say(this.homey.__('util.something_wrong') + ' ' + error);
                return reject(error);
              })
            return resolve();
          } else if (!confirmed) {
            this.homey.speechOutput.say(this.homey.__('util.no_action_taken'));
            return reject(this.homey.__('util.no_action_taken'));
          } else {
            return reject(this.homey.__('util.inconclusive_response'));
          }
        });
      } catch(error) {
        this.homey.speechOutput.say(this.homey.__('util.Something went wrong') + ' ' + error);
        return reject(error);
      }
    })
  }

  getDateTime() {
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

  checkStatus = (res) => {
    if (res.ok) {
      return res;
    } else {
      if (res.status == 401) {
        throw new Error(this.homey.__('util.unauthorized'));
      } else if (res.status == 502 || res.status == 504) {
        throw new Error(this.homey.__('util.timeout'));
      } else if (res.status == 500) {
        throw new Error(this.homey.__('util.servererror'));
      } else {
        throw new Error(res.status);
      }
    }
  }

}

module.exports = Util;
