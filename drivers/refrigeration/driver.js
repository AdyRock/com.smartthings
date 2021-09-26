/*jslint node: true */
'use strict';

const Homey = require( 'homey' );

class FridgeDriver extends Homey.Driver
{
    /**
     * onInit is called when the driver is initialized.
     */
    async onInit()
    {
        this.log( 'FridgeDriver has been initialized' );
    }

    async onPairListDevices()
    {
        return this.homey.app.getDevicesByCategory( 'Refrigerator' );
    }
}

module.exports = FridgeDriver;