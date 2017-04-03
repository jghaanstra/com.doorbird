var utils = require('/lib/utils.js');

module.exports = [
	{
		description: 'Doorbell trigger',
		method     : 'GET',
		path       : '/doorbell/:mac',
		requires_authorization: false,
		fn: function( callback, args ) {
            triggerDoorbird(callback, args, 'doorbell');
		}
	},
	{
		description: 'Motionsensor trigger',
		method     : 'GET',
		path       : '/motionsensor/:mac',
		requires_authorization: false,
		fn: function( callback, args ) {
            triggerDoorbird(callback, args, 'motionsensor');
		}
	},
	{
		description: 'Door opener trigger',
		method     : 'GET',
		path       : '/dooropen/:mac',
		requires_authorization: false,
		fn: function( callback, args ) {
			triggerDoorbird(callback, args, 'dooropen');
		}
	},
	{
		description: 'Set Doorbird notification URLs',
		method     : 'PUT',
		path       : '/notifications/',
		requires_authorization: true,
		fn: function( callback, args ) {
			Homey.manager('drivers').getDriver('doorbird').setNotifications(callback, args.body.relaxationdb, args.body.relaxationms, args.body.relaxationdo);
		}
	},
	{
		description: 'Test email',
		method     : 'PUT',
		path       : '/testemail/',
		requires_authorization: true,
		fn: function( callback, args ) {
			utils.testEmail(callback, args);
		}
	}
]

function triggerDoorbird(callback, args, trigger) {
	var doorbirds = Homey.manager('drivers').getDriver('doorbird').getDoorbirds();
	var ipv4 = args.req.remoteAddress.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g)[0];

	Object.keys(doorbirds).forEach(function(key) {
		if (doorbirds[key].settings.address == ipv4 && doorbirds[key].settings.id == args.params.mac) {
            if (trigger == 'doorbell' || trigger == 'motionsensor') {
                var device_data = {
                    device: {
                        address  : doorbirds[key].settings.address,
                        username : doorbirds[key].settings.username,
            			password : doorbirds[key].settings.password
                    }
                };
                utils.createEmailSnapshot(device_data).then(image => {
                    base64 = 'data:image/jpeg;base64,' + image;
                    Homey.manager('flow').triggerDevice(trigger, {snapshot: base64});
                }).then(() => {
                    callback( null, 'OK' );
                }).catch(error => {
                    callback( error, false );
                })
            } else {
                Homey.manager('flow').triggerDevice(trigger);
                callback( null, 'OK' );
            }
		} else {
			callback( null, 'Not authorised, incoming IP address ('+ ipv4 +') does not match DoorBird IP address ('+ doorbirds[key].settings.address +') or MAC address of incoming request does not match DoorBird MAC address.' );
		}
	});
}
