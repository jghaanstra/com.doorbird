var utils = require('../utils.js')

exports.init = function () {

    Homey.manager('flow').on('action.emailsnapshot', function( callback, args, state ) {
        utils.createEmailSnapshot(args).then(data => {
            return utils.sendEmail(data, args);
        }).then(() => {
            callback( null, true );
        }).catch(error => {
            callback( error, false );
        })
    });

    Homey.manager('flow').on('action.light', function( callback, args, state ) {
        utils.light(callback, args);
        callback( null, true );
    });

    Homey.manager('flow').on('action.door', function( callback, args, state ) {
        utils.door(callback, args);
        callback( null, true );
    });

}
