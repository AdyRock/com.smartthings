Add devices from SmartThings to Homey

The app uses the updated SmartThings Personal Access Token (PAT) flow during pairing and repair.

New PAT procedure:

1. Start pairing (or repair) in Homey and press the "Get Token" button on the first screen.
2. This opens the Samsung token page: https://account.smartthings.com/tokens/new
3. Generate a new Personal Access Token and assign at least the following permissions:

Devices:
  List all devices,
  See all devices,
  Control all devices

Applications:
	See all apps
	Manage all apps*

Locations:
  See all locations,
  Control all locations

Scenes (not currently used but maybe in the future)
  See all scenes,
  Control this scenes

Custom Capabilities:
  See all custom Capabilities


4. Click "Generate Token". The token is shown only once, so copy it before leaving the page.
5. Paste the token into the Homey pairing/repair screen and continue.

6. Provided the PAT was given permission to *Manage all apps, you will see the next screen to connect to your account via OAuth
7. Make sure you accept the permissions on this screen and connect.

	Note: The PAT token expires in 24 hours, but the OAuth tokens can be refreshed automatically by the app. so steps 6 and 7 are very important.

	Important for existing installs:
	If you already had devices installed before this change, they will keep using their existing (legacy) PAT after update.
	Those devices will continue to use the old PAT until that device is repaired.

	Samsung put a limit on the number of times the server can be accessed so make sure you don't set the Polling time to low. The actual time will depend on the number of devices you add to this app as each one will need to make an API call to get the current status.

8. Select the items you want to add to Homey and then tap on Next.

So far the app has been tested with:
  Lights (on / off and dim),
  Sockets (on / off),
  Contact sensors (contact alarm),
  some features of Samsung washing machines,
  some features of Samsung TVs,
  Samsung Home / Away detection.

Other devices might work if they have those capabilities. However if you have any devices that are not detected then let me know via the forum or GitHub.


