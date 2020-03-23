Add devices from SmartThings to Homey

The app requires that you obtain a Personal Access Token (also known as a Bearer Token) by logging in to your Samsung Account at https://account.smartthings.com/login?redirect=https%3A%2F%2Faccount.smartthings.com%2Ftokens
Once you have logged in you can click on the Generate New Token button. You will have to provide a name for the token, which can be whatever you want, and also assign the permission for the token.
Make sure you assign at least the following permissions:

Devices:
  List all devices,
  See all devices,
  Control all devices

Locations:
  See all locations,
  Control all locations

Scenes (not currently used but maybe in the future)
  See all scenes,
  Control this scenes

Custom Capabilities:
  See all custom Capabilities


Once those boxes are ticked you can click on the Generate Token button. A long code will be shown and you must copy it before closing or moving away from that page as it will not be shown again.
When you have copied the code you will need to enter it in the "Configure app" page of this app.

Samsung put a limit on the number of times the server can be accessed so make sure you don't set the Polling time to low. The actual time will depend on the number of devices you add to this app as each one will need to make an API call to get the current status.

Once you have entered the token you can then go to the devices section and perform the normal add devices procedure to find all the devices in your Samsung account.
Select the items you want to add to Homey and then tap on Next.

So far the app has been tested with:
  Lights (on / off and dim),
  Sockets (on / off),
  Contact sensors (contact alarm),
  some features of Samsung washing machines,
  some features of Samsung TVs,
  Samsung Home / Away detection.

Other devices might work if they have those capabilities. However if you have any devices that are not detected then let me know via the forum or GitHub.


