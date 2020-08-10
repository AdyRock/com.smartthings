'use strict';

const Homey = require( 'homey' );

class STDriver extends Homey.Driver
{

    onInit()
    {
        this.log( 'STDriver has been inited' );

        this.ac_mode_action = new Homey.FlowCardAction( 'ac_mode_action' );
        this.ac_mode_action
            .register()
            .registerRunListener( async ( args, state ) =>
            {
                console.log( "ac_mode_action" );
                args.device.onCapabilityAirConMode( args.ac_mode, null );
                return await args.device.setCapabilityValue( 'aircon_mode', true ); // Promise<void>
            } )
    }

    // this is the easiest method to overwrite, when only the template 'Drivers-Pairing-System-Views' is being used.
    onPairListDevices( data, callback )
    {
        // Required properties:
        //"data": { "id": "abcd" },

        // Optional properties, these overwrite those specified in app.json:
        // "name": "My Device",
        // "icon": "/my_icon.svg", // relative to: /drivers/<driver_id>/assets/
        // "capabilities": [ "onoff", "dim" ],
        // "capabilitiesOptions: { "onoff": {} },

        // Optional properties, device-specific:
        // "store": { "foo": "bar" },
        // "settings": { "my_setting": "my_value" },

        Homey.app.getDevices().then( function( devices )
        {
            Homey.app.updateLog( devices );
            callback( null, devices );

        } ).catch( function( err )
        {
            callback( new Error( "Connection Failed" + Homey.app.varToString( err ) ), [] );
        } );
    }
}

module.exports = STDriver;