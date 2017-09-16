const util = require('/lib/util.js');

exports.init = function () {

    new Homey.FlowCardAction('emailsnapshot')
        .register()
        .registerRunListener((args) => {

            const emailSnapshot = async () => {
                const image = await util.createSnapshot(args.device.address, args.device.username, args.device.password)
                if (image) {
                    return Promise.resolve(util.sendSnapshot(image, args);
                } else {
                    throw new Error('Snapshot not created succesfully')
                }
            }
            emailSnapshot();
        });

/*
    let emailSnapshotHistory = new Homey.FlowCardAction('emailsnapshothistory');
    emailSnapshotHistory
        .register()
        .registerRunListener(( args, state ) => {


        })

    Homey.manager('flow').on('action.emailsnapshothistory', function( callback, args, state ) {
        util.retrieveHistorySnapshot(args).then(data => {
            return util.sendHistoryEmail(data, args);
        }).then(() => {
            callback( null, true );
        }).catch(error => {
            callback( error, false );
        })
    });*/


}
