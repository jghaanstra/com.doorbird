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

    Homey.manager('flow').on('action.emailsnapshothistory', function( callback, args, state ) {
        utils.retrieveHistorySnapshot(args).then(data => {
            return utils.sendHistoryEmail(data, args);
        }).then(() => {
            callback( null, true );
        }).catch(error => {
            callback( error, false );
        })
    });

    Homey.manager('flow').on('action.light', function( callback, args, state ) {
        utils.light(args, callback);
    });

    Homey.manager('flow').on('action.door', function( callback, args, state ) {
        utils.door(args, callback);
    });

    Homey.manager('flow').on('action.ask_door', function( callback, args, state ) {
        utils.ask_door(args, callback);
    });

}
