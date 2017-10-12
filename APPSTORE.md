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
After installation of the Homey app you need to add your DoorBird(s) as device in Homey. This requires you to enter the local IP address of the DoorBird and the credentials of a valid user account. This account can be created through the DoorBird smartphone app. Best is to use a seperate account for this. The IP address of the DoorBird can be found in your router, best is to have the router assign a static IP address for your DoorBird. During pairing of the device you will be able to test the connection and will see a snapshot if the connection has been tested succesfully.

### Setting up notifications
For the doorbell alarm, motion alarm, doorbell rang and motion detected trigger flow cards to work in Homey the DoorBird needs to be configured to send notifications on these events to Homey. In the general settings of the DoorBird app there is a section where you can automatically configure these notifications with the push of a button. All you need to do is set the relaxation time for each event (time in seconds between concurring events) and choose to enable a specific notification.

### Setting up email
To be able to send snapshots through email you will need to configure an email account which sends out the email. In the general settings of the DoorBird app there is a section to configure your email account. Please pay attention to the extra information when adding a Gmail account, this requires you to use a specific app password which needs to be setup within your Google account.

## Changelog
### 2017-10-12 - v2.1.0
- NEW: added support for 3 new global image tokens: live snapshot, latest doorbell snapshot and latest motionsensor snapshot. In time these global image tokens will replace the current snapshot tokens from the trigger cards.

### 2017-10-06 - v2.0.1
- UPDATE: no functionality changes, made use of official donation button feature of Homey app store

### 2017-09-18 -- v2.0.0
- UPDATE: rewritten app for SDK2
- NEW: implemented the doorbell class and generic alarm and motion alarm capability
- NEW: added ability to enable/disable event notifications from the Doorbird on the settings page
