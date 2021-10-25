/*jslint node: true */
'use strict';

const Homey = require( 'homey' );

class FridgeDevice extends Homey.Device
{
    /**
     * onInit is called when the device is initialized.
     */
    async onInit()
    {
        this.log( 'FridgeDevice has been initialized' );

        this.registerCapabilityListener( 'onoff', this.onCapabilityOnoff.bind( this ) );
        this.registerCapabilityListener( 'target_temperature', this.onCapabilityTargetTemperature.bind( this ) );

        try
        {
            this.getDeviceValues();
        }
        catch ( err )
        {
            this.log( 'FridgeDevice initialized ', err.message );
        }
    }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded()
    {
        this.log( 'FridgeDevice has been added' );
    }

    // this method is called when the Homey device has requested a state change (turned on or off)
    async onCapabilityOnoff( value, opts )
    {
        try
        {
            // Get the device information stored during pairing
            const devData = this.getData();

            // The device requires 'off' and 'on'
            var data = 'off';
            if ( value )
            {
                data = 'on';
            }

            let body = {
                "commands": [
                {
                    "component": "main",
                    "capability": "refrigeration",
                    "command": 'setRapidFreezing',
                    "arguments": [ data ]
                } ]
            };

            // Set the switch Value on the device using the unique feature ID stored during pairing
            await Homey.app.setDeviceCapabilityValue( devData.id, body );
        }
        catch ( err )
        {
            //this.setUnavailable();
            Homey.app.updateLog( this.getName() + " onCapabilityOnoff Error " + Homey.app.varToString( err.message ) );
        }
    }

    // this method is called when the Homey device has requested a temperature set point change
    async onCapabilityTargetTemperature( value, opts )
    {
        try
        {
            let body = {
                "commands": [
                {
                    "component": "freezer",
                    "capability": "thermostatCoolingSetpoint",
                    "command": "setCoolingSetpoint",
                    "arguments": [ value ]
                } ]
            };

            // Get the device information stored during pairing
            const devData = this.getData();

            // Set the dim Value on the device using the unique feature ID stored during pairing
            await Homey.app.setDeviceCapabilityValue( devData.id, body );
        }
        catch ( err )
        {
            //this.setUnavailable();
            Homey.app.updateLog( this.getName() + " onCapabilityTargetTemperature " + Homey.app.varToString( err.message ) );
        }
    }

    async getDeviceValues()
    {
        const devData = this.getData();

        try
        {
            // Get the door open state
            let value = await Homey.app.getDeviceCapabilityValue( devData.id, 'onedoor', 'contactSensor' );
            if ( value )
            {
                this.setCapabilityValue( 'alarm_contact', value.contact.value === 'open' ).catch(this.error);
            }

            // Get the Target temperature
            value = await Homey.app.getDeviceCapabilityValue( devData.id, 'freezer', 'thermostatCoolingSetpoint' );
            if ( value )
            {
                this.setCapabilityValue( 'target_temperature', value.coolingSetpoint.value ).catch(this.error);
            }

            // Get the rapid freeze state
            value = await Homey.app.getDeviceCapabilityValue( devData.id, 'main', 'refrigeration' );
            if ( value )
            {
                this.setCapabilityValue( 'onoff', value.rapidFreezing.value === 'on' ).catch(this.error);
            }
        }
        catch ( err )
        {
            this.log( "Get Device values Error ", err.message );
        }
    }

    /**
     * onSettings is called when the user updates the device's settings.
     * @param {object} event the onSettings event data
     * @param {object} event.oldSettings The old settings object
     * @param {object} event.newSettings The new settings object
     * @param {string[]} event.changedKeys An array of keys changed since the previous version
     * @returns {Promise<string|void>} return a custom message that will be displayed
     */
    async onSettings( { oldSettings, newSettings, changedKeys } )
    {
        this.log( 'MyDevice settings where changed' );
    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed( name )
    {
        this.log( 'MyDevice was renamed' );
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted()
    {
        this.log( 'MyDevice has been deleted' );
    }
}

module.exports = FridgeDevice;