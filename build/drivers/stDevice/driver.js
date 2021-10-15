/*jslint node: true */
'use strict';

const Homey = require( 'homey' );

class STDriver extends Homey.Driver
{

    onInit()
    {
        this.log( 'STDriver is initialising' );
    }

    // this is the easiest method to overwrite, when only the template 'Drivers-Pairing-System-Views' is being used.
    async onPairListDevices()
    {
        return this.homey.app.getDevices();
    }
}

module.exports = STDriver;