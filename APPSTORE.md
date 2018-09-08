# DoorBird for Homey
Use Homey together with the [DoorBird IP Video Door Station](https://www.doorbird.com/).

**Supported Cards**
- [TRIGGER] Doorbell rang
- [TRIGGER] Motion detected
- [TRIGGER] Door opened
- [ACTION] Send live snapshot through email
- [ACTION] Send history snapshot through email
- [ACTION] Turn on IR light
- [ACTION] Open door through relay
- [ACTION] Let Homey ask you if you want to door opened through the door relay

## Instructions
### Adding the DoorBird as device
After installation of the Homey app you need to add your DoorBird(s) as device in Homey. This requires you to enter the local IP address of the DoorBird and the credentials of a valid user account. This account can be created through the DoorBird smartphone app. Best is to use a seperate account for this and make sure this user is granted API-operator permissions as this is needed for configuring the Homey triggers. The IP address of the DoorBird can be found in your router, best is to have the router assign a static IP address for your DoorBird. During pairing of the device you will be able to test the connection and will see a snapshot if the connection has been tested succesfully.

### Setting up notifications
For the doorbell alarm, motion alarm, doorbell rang, motion detected and door open trigger flow cards to work in Homey the DoorBird needs to be configured to send HTTP notifications based on these events to Homey. The DoorBird company recently changed they way this works (as of DoorBird firmware 0110). If you have added your DoorBird to Homey before 2018-02-20 follow these steps first.
- Open the DoorBird smartphone app, go to the administration area and select the user you have used to add your DoorBird to Homey
- Go the the permissions of this user and grant this user API-operator permissions
- Go back and select the HTTP calls option under the Favorites section, delete all legacy HTTP calls containing your Homey IP address

After these steps or when added a DoorBird for the first time follow these steps (make sure you have added your DoorBird as device within Homey using a user with API-operator permissions):
- Go to the DoorBird general settings within Homey under the settings section.
- Click the button to add the HTTP notication URL's and wait for the succesfull confirmation
- If you want to use the door open  / relay trigger card also click the button to schedule the relay trigger event
- Open the DoorBird smartphone app, go to the administration area and select the '3D motion sensor settings' option
- Set the pause between alarm option to your preference (during the period no new events will be send to Homey)
- After that select the the 'Schedule for actions' option
- On this page select 'HTTP calls' from the top left icon pull down and select 'Homey Motion Trigger' from the top middle menu and click op the top left menu to fill the schedule (or configure it to your preference, this determines when the DoorBird will send motion events to Homey)
- Go back twice and select the option 'Relays' and then the option 'Schedule'
- On this page select 'HTTP calls' from the top left icon pull down and select 'Homey Relay Trigger' from the top middle menu and click op the top left menu to fill the schedule (or configure it to your preference, this determines when the DoorBird will send door open events to Homey)
- Go back twice and select the option 'Schedule for doorbell'
- On this page select 'HTTP calls' from the top left icon pull down and select 'Homey Doorbell Trigger' from the top middle menu and click op the top left menu to fill the schedule (or configure it to your preference, this determines when the DoorBird will send doorbell events to Homey)
- Test your settings, everything should be setup now to receive events from your DoorBird within Homey

### Setting up email
To be able to send snapshots through email you will need to configure an email account which sends out the email. In the general settings of the DoorBird app there is a section to configure your email account. Please pay attention to the extra information when adding a Gmail account, this requires you to use a specific app password which needs to be setup within your Google account.

## Support topic
For support please use the official support topic on the forum [here](https://community.athom.com/t/115).

## Changelog
### 2018-09-08 - v2.2.3
* REFACTORING: switched from request node module to node-fetch (reduced footprint from 9MB to 1,5MB)
* UPDATE: removed settings for scheduling relay notifications, this can now be set in the DoorBird smartphone app

### 2018-08-22 - v2.2.2
* DOCS: updated the description to explain in more detail how to configure the door relay trigger
* UPDATE: updated app manifest to include id of new forum support topic
* UPDATE: updated node packages to latest versions
