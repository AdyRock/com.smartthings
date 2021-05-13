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

    onPairListDevices( data, callback )
    {
        Homey.app.getDevicesByCategory( 'Refrigerator' ).then( function( devices )
        {
            Homey.app.updateLog( devices );
            callback( null, devices );

        } ).catch( function( err )
        {
            callback( err, [] );
        } );
    }
}

module.exports = FridgeDriver;