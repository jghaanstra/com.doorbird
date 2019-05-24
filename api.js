const Homey = require('homey');
const util = require('/lib/util.js');

module.exports = [
	{
		description: 'Doorbell trigger',
		method   : 'GET',
		path     : '/doorbell/:mac',
		public   : true,
		fn: function(args, callback) {
			triggerDoorbird(args, 'doorbell', callback);
		}
	},
	{
		description: 'Motionsensor trigger',
		method   : 'GET',
		path     : '/motionsensor/:mac',
		public   : true,
		fn: function(args, callback) {
			triggerDoorbird(args, 'motionsensor', callback);
		}
	},
	{
		description: 'Door opener trigger',
		method   : 'GET',
		path     : '/dooropen/:mac',
		public   : true,
		fn: function(args, callback) {
			triggerDoorbird(args, 'dooropen', callback);
		}
	},
	{
		description: 'Relay trigger',
		method   : 'GET',
		path     : '/relays/:mac/:relay',
		public   : true,
		fn: function(args, callback) {
			triggerDoorbird(args, 'relay', callback);
		}
	},
	{
		description: 'Set Doorbird notification URLs',
		method   : 'PUT',
		path     : '/notifications/',
		public   : false,
		fn: function(args, callback) {
			const setNotifications = async () => {
				try {
					const homeyaddress = await util.getHomeyIp();
					if(homeyaddress) {
						util.updateNotifications(
							homeyaddress,
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
		method   : 'PUT',
		path     : '/testemail/',
		public: false,
		fn: function(args, callback) {
			util.testEmail(args, callback);
		}
	}
]

function triggerDoorbird(args, trigger, callback) {
	var doorbirds = Homey.ManagerDrivers.getDriver('doorbird').getDevices();

	Object.keys(doorbirds).forEach(function(key) {
		if (doorbirds[key].getData().id == args.params.mac) {
			if (trigger == 'doorbell' || trigger == 'motionsensor') {

        (async () => {

  				/* trigger alarms */
  				if (trigger == 'doorbell') {
  					doorbirds[key].setCapabilityValue('alarm_generic', true);
            const res = await doorbirds[key].doorbellSnapShot.update();
            const snapshot = doorbirds[key].doorbellSnapShot;

  					setTimeout(function(){
  						doorbirds[key].setCapabilityValue('alarm_generic', false);
  					}, 10000);

  				} else if (trigger == 'motionsensor') {
  					doorbirds[key].setCapabilityValue('alarm_motion', true);
            const snapshot = await doorbirds[key].doorbirdSnapShot.getStream();

            //to do: performance wise this does not seem to be a smart thing
            //doorbirds[key].motionsensorSnapShot.update();

  					setTimeout(function(){
  						doorbirds[key].setCapabilityValue('alarm_motion', false);
  					}, 5000);
  				}

          /* trigger cards with snapshot */
          Homey.ManagerFlow.getCard('trigger', trigger).trigger(doorbirds[key], {snapshot: snapshot}, {})
            .then(result => {
              callback(null, 'OK');
            })
            .catch(error => {
              callback(error, false);
            })

        })().catch(error => {
          callback(error, false);
        });

			} else if (trigger == 'relay') {
				Homey.ManagerFlow.getCard('trigger', 'dooropen').trigger(doorbirds[key], {relay: args.params.relay}, {})
					.then(result => {
						callback(null, 'OK');
					})
					.catch(error => {
						callback(error, false);
					})
			} else {
				Homey.ManagerFlow.getCard('trigger', trigger).trigger(doorbirds[key], {relay: '1'}, {})
					.then(result => {
						callback(null, 'OK');
					})
					.catch(error => {
						callback(error, false);
					})
			}
		} else {
			callback(null, 'MAC address of incoming request does not match DoorBird MAC address.');
		}
	});
}
