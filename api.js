var utils = require('/lib/utils.js');

module.exports = [
	{
		description: 'Doorbell trigger',
		method     : 'GET',
		path       : '/doorbell/:mac',
		requires_authorization: false,
		fn: function( callback, args ) {
            Homey.log("Args: "+ JSON.stringify(args));
            triggerDoorbird(callback, args, 'doorbell');
		}
	},
	{
		description: 'Motionsensor trigger',
		method     : 'GET',
		path       : '/motionsensor/:mac',
		requires_authorization: false,
		fn: function( callback, args ) {
            Homey.log("Args: "+ JSON.stringify(args));
            triggerDoorbird(callback, args, 'motionsensor');
		}
	},
    {
        description: 'Set Doorbird notification URLs',
        method     : 'PUT',
        path       : '/notifications/',
        requires_authorization: true,
        fn: function( callback, args ) {
            Homey.manager('drivers').getDriver('doorbird').setNotifications(callback, args.body.relaxationdb, args.body.relaxationms);
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

/* FUNCTIONS */
// TODO: Preferably check incoming IP to match Doorbird IP but due to https://github.com/athombv/homey/issues/1249 it's not always available in args.req.remoteAddress
/*
function triggerDoorbird(callback, args, trigger) {
    var doorbirds = Homey.manager('drivers').getDriver('doorbird').getDoorbirds();
    var ipv4 = args.req.remoteAddress.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g)[0];

    Object.keys(doorbirds).forEach(function(key) {
        if (doorbirds[key].settings.address == ipv4 && doorbirds[key].settings.id == args.params.mac) {
            Homey.manager('flow').triggerDevice(trigger);
            callback( null, 'OK' );
        } else {
            callback( null, 'Not authorised, incoming IP address ('+ ipv4 +') does not match DoorBird IP address ('+ doorbirds[key].settings.address +') or MAC address of incoming request does not match DoorBird MAC address.' );
        }
    });
}*/

function triggerDoorbird(callback, args, trigger) {
    var doorbirds = Homey.manager('drivers').getDriver('doorbird').getDoorbirds();

    Object.keys(doorbirds).forEach(function(key) {
        if (doorbirds[key].settings.id == args.params.mac) {
            Homey.manager('flow').triggerDevice(trigger);
            callback( null, 'OK' );
        } else {
            callback( null, 'Not authorised, MAC address of incoming request does not match DoorBird MAC address' );
        }
    });
}
