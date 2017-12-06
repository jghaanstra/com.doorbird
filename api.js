const Homey = require('homey');
const util = require('/lib/util.js');

module.exports = [
	{
		description: 'Doorbell trigger',
		method     : 'GET',
		path       : '/doorbell/:mac',
		public     : true,
		fn: function(args, callback) {
            triggerDoorbird(args, 'doorbell', callback);
		}
	},
	{
		description: 'Motionsensor trigger',
		method     : 'GET',
		path       : '/motionsensor/:mac',
		public     : true,
		fn: function(args, callback) {
            triggerDoorbird(args, 'motionsensor', callback);
		}
	},
	{
		description: 'Door opener trigger',
		method     : 'GET',
		path       : '/dooropen/:mac',
		public     : true,
		fn: function(args, callback) {
			triggerDoorbird(args, 'dooropen', callback);
		}
	},
	{
		description: 'Set Doorbird notification URLs',
		method     : 'PUT',
		path       : '/notifications/',
		public     : false,
		fn: function(args, callback) {
            const setNotifications = async () => {
                try {
                    const homeyaddress = await util.getHomeyIp();
                    if(homeyaddress) {
                        util.updateNotifications(
                            homeyaddress,
                            args.body.relaxationdb,
                            args.body.relaxationdbenable,
                            args.body.relaxationms,
                            args.body.relaxationmsenable,
                            args.body.relaxationdo,
                            args.body.relaxationdoenable,
                            callback
                        );
                    }
                } catch (error) {
                    callback(error, false);
                }
            }
            setNotifications();
		}
	},
	{
		description: 'Test email',
		method     : 'PUT',
		path       : '/testemail/',
		public: false,
		fn: function(args, callback) {
			util.testEmail(args, callback);
		}
	}
]

function triggerDoorbird(args, trigger, callback) {
	var doorbirds = Homey.ManagerDrivers.getDriver('doorbird').getDevices();
	var ipv4 = args.req.remoteAddress.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g)[0];

	Object.keys(doorbirds).forEach(function(key) {
		if (doorbirds[key].getSetting('address') == ipv4 && doorbirds[key].getSetting('id') == args.params.mac) {
            if (trigger == 'doorbell' || trigger == 'motionsensor') {

                /* create snapshot */
                const snapShot = async () => {
                    try {
                        const image = await util.createSnapshot(doorbirds[key].getSetting('address'), doorbirds[key].getSetting('username'), doorbirds[key].getSetting('password'))
                        if (image) {
                            var snapshot = image.toString('base64');
                            Homey.ManagerFlow.getCard('trigger', trigger).trigger(doorbirds[key], {snapshot: snapshot}, {})
                                .then(result => {
                                    callback(null, 'OK');
                                })
                                .catch(error => {
                                    callback(error, false);
                                })
                        }
                    } catch (error) {
                        callback(error, false);
                    }
                }
                snapShot();

                /* trigger alarms */
                if (trigger == 'doorbell') {
                    var timerdb = Homey.ManagerSettings.get('notification_relaxationdb');
                    doorbirds[key].setCapabilityValue('alarm_generic', true);

                    setTimeout(function(){
                        doorbirds[key].setCapabilityValue('alarm_generic', false);
                    }, timerdb * 1000);

                } else if (trigger == 'motionsensor') {
                    var timerms = Homey.ManagerSettings.get('notification_relaxationms');
                    doorbirds[key].setCapabilityValue('alarm_motion', true);

                    setTimeout(function(){
                        doorbirds[key].setCapabilityValue('alarm_motion', false);
                    }, timerms * 1000);
                }
            } else {
                Homey.ManagerFlow.getCard('trigger', trigger).trigger(doorbirds[key], {}, {})
                    .then(result => {
                        callback(null, 'OK');
                    })
                    .catch(error => {
                        callback(error, false);
                    })
            }
		} else {
			callback(null, 'Not authorised, incoming IP address ('+ ipv4 +') does not match DoorBird IP address ('+ doorbirds[key].getSetting('address') +') or MAC address of incoming request does not match DoorBird MAC address.');
		}
	});
}
