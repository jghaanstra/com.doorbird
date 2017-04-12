# DoorBird for Homey
<img src="https://raw.githubusercontent.com/jghaanstra/com.doorbird/master/assets/readme/doorbird-logo.png" alt="DoorBird" border="0" style="width: 100%; height: auto;" align="right" />
Use [Homey](https://www.athom.com/) together with the [DoorBird IP Video Door Station](https://www.doorbird.com/). Let the DoorBird notify Homey when the doorbell is rang or when motion is detected or use Homey to control the DoorBird and trigger the IR light or send a snapshot through email.

**Supported Cards**
- [TRIGGER] Doorbell rang
- [TRIGGER] Motion detected
- [TRIGGER] Door opened
- [ACTION] Send live snapshot through email
- [ACTION] Send history snapshot through email
- [ACTION] Turn on IR light
- [ACTION] Open door through relay

## Instructions
### Adding the DoorBird as device
After installation of the Homey app you need to add your DoorBird(s) as device in Homey. This requires you to enter the local IP address of the DoorBird and the credentials of a valid user account. This account can be created through the DoorBird smartphone app. Best is to use a seperate account for this. The IP address of the DoorBird can be found in your router, best is to have the router assign a static IP address for your DoorBird. During pairing of the device you will be able to test the connection and will see a snapshot if the connection has been tested succesfully.

### Setting up notifications
For the doorbell rang and motion detected trigger flow cards to work in Homey the DoorBird needs to be configured to send notifications on these events to Homey. In the general settings of the DoorBird app there is a section where you can automatically configure these notifications with the push of a button. All you need to do is set the relaxation time for each event (time in seconds between concurring events).

### Setting up email
To be able to send snapshots through email you will need to configure an email account which sends out the email. In the general settings of the DoorBird app there is a section to configure your email account. Please pay attention to the extra information when adding a Gmail account, this requires you to use a specific app password which needs to be setup within your Google account.

## Changelog
### 2017-04-12 -- v1.3.0
- NEW: Added token with base64 encoded snapshot image for doorbell and motionsensor trigger card which can be used in notification or email apps with action cards that support these kind of tokens (like Telegram app).
- FIX: Updated some incorrect translations

### 2017-04-01 -- v1.2.0
- NEW: Added an action card for sending history snapshots from both the doorbell and the motionsensor. The Doorbird keeps the latest 20 snapshots in memory.
- IMPROVEMENT: Added extra validation for incoming requests to enhance security, incoming IP address has to match the IP address of an added Doorbird device.

### 2017-02-19 -- v1.1.0
- Added trigger card for door open (use the door open button from the DoorBird app and do anything you like within Homey, no need for a connected smart lock - this might require DoorBird firmware 102 which will be released sometime in february)
- Added German translation (thanx QNimbus)

### 2017-02-06 -- v1.0.0
- Initial release
